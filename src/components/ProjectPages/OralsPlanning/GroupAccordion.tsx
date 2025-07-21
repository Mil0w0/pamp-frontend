import { useEffect, useState } from 'react'
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'

type GroupAccordionProps = {
    group: ProjectGroup
    goToGroup: (groupId: string) => void
}

export default function GroupAccordion({
    group,
    goToGroup,
}: GroupAccordionProps) {
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                if (group.studentsIds?.length > 0) {
                    const response = await authService.getStudentsById(
                        group.studentsIds
                    )
                    if (response.success && response.data) {
                        setStudents(response.data)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch students', error)
                setStudents([])
            } finally {
                setIsLoading(false)
            }
        }
        fetchStudents()
    }, [group.studentsIds])

    return (
        <Accordion
            type="single"
            collapsible
            defaultValue={students.length > 0 ? '0' : ''}
        >
            <AccordionItem value={group.id}>
                <AccordionTrigger className="flex justify-between">
                    <span
                        onClick={() => goToGroup(group.id)}
                        className="cursor-pointer hover:underline"
                    >
                        {group.name}
                    </span>
                </AccordionTrigger>
                <AccordionContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center p-2">
                            <LoadingSpinner />
                        </div>
                    ) : students.length > 0 ? (
                        <ul className="pl-4 list-disc text-sm  pb-0">
                            {students.map((student, idx) => (
                                <li key={idx}>
                                    {student.first_name} {student.last_name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No students in this group.
                        </p>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
