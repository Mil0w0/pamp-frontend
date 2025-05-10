import { Student } from '@/components/ManageStudentBatches/types.ts'
import { read, utils } from 'xlsx'

export async function makeStudentsFromFile(
    file: File,
    extension: string
): Promise<Student[]> {
    switch (extension) {
        case 'csv': {
            try {
                const arrayBuffer = await file.arrayBuffer()

                const workbook = read(arrayBuffer, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]

                const studentsParsed: Student[] = utils.sheet_to_json(sheet)
                const students: Student[] = []
                console.log(students)
                let index = 0
                for (const student of studentsParsed) {
                    students.push({
                        ...student,
                        id: `id-${Date.now()}-${index}`,
                    })
                    index++
                }
                return students
            } catch (error) {
                console.error('Error parsing CSV file:', error)
                throw error
            }
        }
        default:
            return []
    }
}
