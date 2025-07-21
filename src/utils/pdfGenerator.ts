import { DateTime } from 'luxon'
import { Project } from '@/components/ManageProjects/types.ts'
import { toast } from 'sonner'
import { error, PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { OralDTO } from '@/services/ProjectService/types.ts'
import { User } from '@/services/UserService/types.ts'
import { formatToShortDateAndTime } from '@/utils/dateFormatter.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { Student } from '@/components/ManageStudentBatches/types.ts'

export const generatePlanning = async (
    oralPlanning: OralDTO[],
    project: Project,
    groups: ProjectGroup[],
    teacher: User | null
) => {
    if (oralPlanning.length === 0) {
        toast.error('No oral planning to export')
        return
    }
    if (!teacher) return

    try {
        // Sort planning by start time
        const sortedPlanning = [...oralPlanning].sort(
            (a, b) =>
                DateTime.fromISO(a.startTime).toMillis() -
                DateTime.fromISO(b.startTime).toMillis()
        )

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()

        // Add fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBoldFont = await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
        )

        // Add a page
        const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
        const { width, height } = page.getSize()

        // Colors
        const darkGray = rgb(0.2, 0.2, 0.2)
        const mediumGray = rgb(0.4, 0.4, 0.4)
        const lightGray = rgb(0.9, 0.9, 0.9)
        const green = rgb(0.02, 0.4, 0.41)

        // Starting positions
        let currentY = height - 60
        const margin = 50
        const tableStartY = currentY - 120

        // Header
        page.drawText('Oral Presentations Planning', {
            x: margin,
            y: currentY,
            size: 24,
            font: helveticaBoldFont,
            color: darkGray,
        })

        currentY -= 30
        page.drawText(project.name, {
            x: margin,
            y: currentY,
            size: 16,
            font: helveticaFont,
            color: mediumGray,
        })

        currentY -= 20
        page.drawText(
            `Jury: ${teacher.first_name} ${teacher.last_name} - ${teacher.email}`,
            {
                x: margin,
                y: currentY,
                size: 12,
                font: helveticaFont,
                color: mediumGray,
            }
        )
        const imageResponse = await fetch('/logo/PAMP-logo.png')
        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const logoImage = await pdfDoc.embedPng(imageArrayBuffer)
        if (logoImage) {
            const logoWidth = 60
            const logoHeight = 60
            const logoX = width - margin - logoWidth
            const logoY = height - margin - logoHeight

            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoWidth,
                height: logoHeight,
            })
        }

        // Draw header line
        currentY -= 20
        page.drawLine({
            start: { x: margin, y: currentY },
            end: { x: width - margin, y: currentY },
            thickness: 2,
            color: lightGray,
        })

        // Table setup
        const tableWidth = width - margin * 2
        const colWidths = [30, 150, 120, 120] // #, Group Name, Start Time, End Time
        const rowHeight = 25
        const headerHeight = 35

        // Calculate column positions
        const colPositions = [margin]
        for (let i = 0; i < colWidths.length - 1; i++) {
            colPositions.push(colPositions[i] + colWidths[i])
        }

        currentY = tableStartY

        // Draw table header
        page.drawRectangle({
            x: margin,
            y: currentY - headerHeight,
            width: tableWidth,
            height: headerHeight,
            color: lightGray,
        })

        // Table header borders
        page.drawRectangle({
            x: margin,
            y: currentY - headerHeight,
            width: tableWidth,
            height: headerHeight,
            borderColor: mediumGray,
            borderWidth: 1,
        })

        // Header text
        const headers = ['#', 'Group Name', 'Start Time', 'End Time']
        headers.forEach((header, index) => {
            page.drawText(header, {
                x: colPositions[index] + 10,
                y: currentY - 22,
                size: 12,
                font: helveticaBoldFont,
                color: darkGray,
            })
        })

        // Draw vertical lines for header
        colPositions.forEach((pos, index) => {
            if (index > 0) {
                page.drawLine({
                    start: { x: pos, y: currentY },
                    end: { x: pos, y: currentY - headerHeight },
                    thickness: 1,
                    color: mediumGray,
                })
            }
        })

        currentY -= headerHeight

        // Table rows
        sortedPlanning.forEach((oral, index) => {
            const group = groups.find((g) => g.id === oral.groupId)
            const startTime = DateTime.fromISO(oral.startTime)
            const endTime = DateTime.fromISO(oral.endTime)

            // Alternate row colors
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: margin,
                    y: currentY - rowHeight,
                    width: tableWidth,
                    height: rowHeight,
                    color: rgb(0.98, 0.98, 0.98),
                })
            }

            // Row border
            page.drawRectangle({
                x: margin,
                y: currentY - rowHeight,
                width: tableWidth,
                height: rowHeight,
                borderColor: lightGray,
                borderWidth: 1,
            })

            // Cell data
            const cellData = [
                (index + 1).toString(),
                group?.name || 'Unknown Group',
                formatToShortDateAndTime(startTime.toISO() || ''),
                formatToShortDateAndTime(endTime.toISO() || ''),
            ]

            // Draw cell content
            cellData.forEach((data, cellIndex) => {
                const font = cellIndex === 1 ? helveticaBoldFont : helveticaFont
                const color = cellIndex === 4 ? green : darkGray

                page.drawText(data, {
                    x: colPositions[cellIndex] + 10,
                    y: currentY - 17,
                    size: 11,
                    font: font,
                    color: color,
                })
            })

            // Draw vertical lines for row
            colPositions.forEach((pos, cellIndex) => {
                if (cellIndex > 0) {
                    page.drawLine({
                        start: { x: pos, y: currentY },
                        end: { x: pos, y: currentY - rowHeight },
                        thickness: 1,
                        color: lightGray,
                    })
                }
            })

            currentY -= rowHeight

            // Check if we need a new page
            if (currentY < 100 && index < sortedPlanning.length - 1) {
                const newPage = pdfDoc.addPage([595.28, 841.89])
                currentY = newPage.getSize().height - 60
                // You could continue the table on the new page here
            }
        })

        // Footer
        currentY -= 30
        page.drawText(`Total orals: ${sortedPlanning.length}`, {
            x: margin,
            y: currentY,
            size: 12,
            font: helveticaFont,
            color: mediumGray,
        })

        // Save the PDF
        const pdfBytes = await pdfDoc.save()

        // Create blob and download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `oral-planning-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-${DateTime.now().toFormat('yyyy-MM-dd')}.pdf`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)

        toast.success('PDF generated and downloaded successfully!')
    } catch (error) {
        console.error('Error generating PDF:', error)
        toast.error('Failed to generate PDF. Please try again.')
    }
}
export const generateAttendanceSheet = async (
    oralPlanning: OralDTO[],
    project: Project,
    groups: ProjectGroup[],
    teacher: User | null,
    sortAlphabetically = false
) => {
    if (oralPlanning.length === 0) {
        toast.error('No oral planning to export')
        return
    }
    if (!teacher) return

    try {
        // Sort planning by start time
        const sortedPlanning = [...oralPlanning].sort(
            (a, b) =>
                DateTime.fromISO(a.startTime).toMillis() -
                DateTime.fromISO(b.startTime).toMillis()
        )

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()

        // Add fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBoldFont = await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
        )

        // Add a page
        const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
        const { width, height } = page.getSize()

        // Colors
        const darkGray = rgb(0.2, 0.2, 0.2)
        const mediumGray = rgb(0.4, 0.4, 0.4)
        const lightGray = rgb(0.9, 0.9, 0.9)
        const lightYellow = rgb(254 / 255, 242 / 255, 177 / 255)
        const darkerYellow = rgb(239 / 255, 220 / 255, 130 / 255)

        // Starting positions
        let currentY = height - 60
        const margin = 25
        const tableStartY = currentY - 120

        // Header
        page.drawText('Orals Attendance sheet', {
            x: margin,
            y: currentY,
            size: 24,
            font: helveticaBoldFont,
            color: darkGray,
        })

        currentY -= 30
        page.drawText(project.name, {
            x: margin,
            y: currentY,
            size: 16,
            font: helveticaFont,
            color: mediumGray,
        })

        currentY -= 20
        page.drawText(
            `Jury: ${teacher.first_name} ${teacher.last_name} - ${teacher.email}`,
            {
                x: margin,
                y: currentY,
                size: 12,
                font: helveticaFont,
                color: mediumGray,
            }
        )
        const imageResponse = await fetch('/logo/PAMP-logo.png')
        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const logoImage = await pdfDoc.embedPng(imageArrayBuffer)
        if (logoImage) {
            const logoWidth = 60
            const logoHeight = 60
            const logoX = width - margin - logoWidth
            const logoY = height - margin - logoHeight

            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoWidth,
                height: logoHeight,
            })
        }

        // Draw header line
        currentY -= 20
        page.drawLine({
            start: { x: margin, y: currentY },
            end: { x: width - margin, y: currentY },
            thickness: 2,
            color: lightGray,
        })

        // Table setup
        const tableWidth = width - margin * 2
        const colWidths = [25, 100, 120, 65, 110, 110] // #, Signature, StudentName, Group Name, Start Time, End Time
        const rowHeight = 25
        const headerHeight = 35

        // Calculate column positions
        const colPositions = [margin]
        for (let i = 0; i < colWidths.length - 1; i++) {
            colPositions.push(colPositions[i] + colWidths[i])
        }

        currentY = tableStartY

        // Draw table header
        page.drawRectangle({
            x: margin,
            y: currentY - headerHeight,
            width: tableWidth,
            height: headerHeight,
            color: lightGray,
        })

        // Table header borders
        page.drawRectangle({
            x: margin,
            y: currentY - headerHeight,
            width: tableWidth,
            height: headerHeight,
            color: darkGray,
        })

        // Header text
        // #, Signature, StudentName, Group Name, Start Time, End Time
        const headers = [
            '#',
            'Signature',
            'Student',
            'Group',
            'Start Time',
            'End Time',
        ]
        headers.forEach((header, index) => {
            page.drawText(header, {
                x: colPositions[index] + 10,
                y: currentY - 22,
                size: 12,
                font: helveticaBoldFont,
                color: lightGray,
            })
        })

        // Draw vertical lines for header
        colPositions.forEach((pos, index) => {
            if (index > 0) {
                page.drawLine({
                    start: { x: pos, y: currentY },
                    end: { x: pos, y: currentY - headerHeight },
                    thickness: 1,
                    color: lightGray,
                })
            }
        })

        currentY -= headerHeight

        // Table rows
        if (sortAlphabetically) {
            const allStudents: {
                student: Student
                groupName: string
                startTime: DateTime
                endTime: DateTime
            }[] = []

            //get all students then sort them
            for (const oral of sortedPlanning) {
                const group = groups.find((g) => g.id === oral.groupId)
                if (!group) continue

                const students = await getStudents(group.studentsIds)
                if (!students) continue

                const startTime = DateTime.fromISO(oral.startTime)
                const endTime = DateTime.fromISO(oral.endTime)

                students.forEach((student) => {
                    allStudents.push({
                        student,
                        groupName: group.name,
                        startTime,
                        endTime,
                    })
                })
            }
            //sort by lastname then firstname if needed
            allStudents.sort((a, b) => {
                const lastA = a.student.last_name.toLowerCase()
                const lastB = b.student.last_name.toLowerCase()
                if (lastA < lastB) return -1
                if (lastA > lastB) return 1
                return a.student.first_name
                    .toLowerCase()
                    .localeCompare(b.student.first_name.toLowerCase())
            })
            let rowCounter = 0
            allStudents.forEach(
                ({ student, groupName, startTime, endTime }, index) => {
                    rowCounter++

                    const fillColor =
                        index % 2 === 0 ? darkerYellow : lightYellow

                    // Alternate row colors
                    page.drawRectangle({
                        x: margin,
                        y: currentY - rowHeight,
                        width: tableWidth,
                        height: rowHeight,
                        color: fillColor,
                    })
                    // Row border
                    page.drawRectangle({
                        x: margin,
                        y: currentY - rowHeight,
                        width: tableWidth,
                        height: rowHeight,
                        borderColor: lightGray,
                        borderWidth: 1,
                    })

                    // Cell data
                    const cellData = [
                        rowCounter.toString(),
                        '',
                        `${student.first_name} ${student.last_name}`,
                        groupName,
                        formatToShortDateAndTime(startTime.toISO() || ''),
                        formatToShortDateAndTime(endTime.toISO() || ''),
                    ]

                    // Draw cell content
                    cellData.forEach((data, cellIndex) => {
                        const font =
                            cellIndex === 1 ? helveticaBoldFont : helveticaFont
                        page.drawText(data, {
                            x: colPositions[cellIndex] + 10,
                            y: currentY - 17,
                            size: 11,
                            font: font,
                            color: darkGray,
                        })
                    })

                    // Draw vertical lines for row
                    colPositions.forEach((pos, cellIndex) => {
                        if (cellIndex > 0) {
                            page.drawLine({
                                start: { x: pos, y: currentY },
                                end: { x: pos, y: currentY - rowHeight },
                                thickness: 1,
                                color: lightGray,
                            })
                        }
                    })

                    currentY -= rowHeight

                    // Check if we need a new page
                    if (currentY < 100 && index < allStudents.length - 1) {
                        const newPage = pdfDoc.addPage([595.28, 841.89])
                        currentY = newPage.getSize().height - 60
                    }
                }
            )
        } else {
            let rowCounter = 0
            for (const oral of sortedPlanning) {
                const index = sortedPlanning.indexOf(oral)
                const group = groups.find((g) => g.id === oral.groupId)
                if (!group) continue

                const students = await getStudents(group.studentsIds)
                if (!students) continue
                const startTime = DateTime.fromISO(oral.startTime)
                const endTime = DateTime.fromISO(oral.endTime)
                const fillColor = index % 2 === 0 ? darkerYellow : lightYellow
                students.forEach((student) => {
                    rowCounter++
                    // Alternate row colors
                    page.drawRectangle({
                        x: margin,
                        y: currentY - rowHeight,
                        width: tableWidth,
                        height: rowHeight,
                        color: fillColor,
                    })
                    // Row border
                    page.drawRectangle({
                        x: margin,
                        y: currentY - rowHeight,
                        width: tableWidth,
                        height: rowHeight,
                        borderColor: lightGray,
                        borderWidth: 1,
                    })

                    // Cell data
                    // #, Signature, StudentName, Group Name, Start Time, End Time
                    const cellData = [
                        rowCounter.toString(),
                        '',
                        `${student.first_name} ${student.last_name}`,
                        group?.name || 'Unknown Group',
                        formatToShortDateAndTime(startTime.toISO() || ''),
                        formatToShortDateAndTime(endTime.toISO() || ''),
                    ]

                    // Draw cell content
                    cellData.forEach((data, cellIndex) => {
                        const font =
                            cellIndex === 1 ? helveticaBoldFont : helveticaFont
                        page.drawText(data, {
                            x: colPositions[cellIndex] + 10,
                            y: currentY - 17,
                            size: 11,
                            font: font,
                            color: darkGray,
                        })
                    })

                    // Draw vertical lines for row
                    colPositions.forEach((pos, cellIndex) => {
                        if (cellIndex > 0) {
                            page.drawLine({
                                start: { x: pos, y: currentY },
                                end: { x: pos, y: currentY - rowHeight },
                                thickness: 1,
                                color: lightGray,
                            })
                        }
                    })

                    currentY -= rowHeight

                    // Check if we need a new page
                    if (currentY < 100 && index < sortedPlanning.length - 1) {
                        const newPage = pdfDoc.addPage([595.28, 841.89])
                        currentY = newPage.getSize().height - 60
                        // You could continue the table on the new page here
                    }
                })
            }
        }

        // Footer
        currentY -= 30
        page.drawText(`Total orals: ${sortedPlanning.length}`, {
            x: margin,
            y: currentY,
            size: 12,
            font: helveticaFont,
            color: mediumGray,
        })

        // Save the PDF
        const pdfBytes = await pdfDoc.save()

        // Create blob and download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `orals-attendance-sheet-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-${DateTime.now().toFormat('yyyy-MM-dd')}.pdf`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)

        toast.success('PDF generated and downloaded successfully!')
    } catch (error) {
        console.error('Error generating PDF:', error)
        toast.error('Failed to generate PDF. Please try again.')
    }
}

const getStudents = async (studentsIds: string) => {
    try {
        const response = await authService.getStudentsById(studentsIds)
        if (response.success) {
            if (response.data) {
                return response.data
            }
        } else {
            console.log(response.message)
            console.log(error)
            return []
        }
    } catch (error) {
        console.log(error)
        return []
    }
}
