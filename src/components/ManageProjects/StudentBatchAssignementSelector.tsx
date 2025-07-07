import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { EditProjectDto, Project } from '@/components/ManageProjects/types.ts'
import { useEffect, useState } from 'react'
import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'
import { batchService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'

type StudentBatchAssignementSelectorProps = {
    project: Project
    userIsStudent: boolean
    onSuccess?: () => void
}

export default function StudentBatchAssignementSelector({
    project,
    userIsStudent,
    onSuccess,
}: StudentBatchAssignementSelectorProps) {
    const [studentBatches, setStudentBatches] = useState<StudentBatch[]>()
    const [isEditing, setIsEditing] = useState(false)
    const navigate = useNavigate()

    //Load student batches
    async function getBatchesStudents(): Promise<StudentBatch[]> {
        try {
            const response = await batchService.getAll()
            if (response.success) {
                return response.data as StudentBatch[]
            } else {
                toast.error(response.error)
                return []
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
            return []
        }
    }

    const assignStudentBatch = async (e: string) => {
        if (userIsStudent) {
            toast.warning(
                "Students can't change the project student batch assigned."
            )
            return
        }
        if (project.groups.length > 0) {
            toast.warning(
                "You can't assign another student batch if groups are already filled. Remove students first."
            )
            return
        }

        const data: EditProjectDto = { studentBatchId: e }
        try {
            const response = await projectService.editProject(project.id, data)
            if (response.success) {
                setIsEditing(false)
                if (onSuccess) {
                    onSuccess()
                } else {
                    navigate('/projects')
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
        }
    }

    useEffect(() => {
        getBatchesStudents()
            .then((data) => setStudentBatches(data))
            .catch((error) => toast.error(error))
    }, [])

    const hasAssignedBatch =
        project.studentBatch && project.studentBatch.name.length > 0

    // Show placeholder with pencil when batch is assigned and not editing
    if (hasAssignedBatch && !isEditing) {
        return (
            <div className="flex items-center gap-2 w-fit">
                <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-background text-foreground font-medium">
                    {project.studentBatch.name}
                </div>
                {!userIsStudent && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        )
    }

    // Show selector when no batch assigned or when editing
    return (
        <Select
            onValueChange={assignStudentBatch}
            disabled={userIsStudent}
            open={isEditing ? undefined : undefined}
        >
            <SelectTrigger className="">
                <SelectValue
                    placeholder={
                        hasAssignedBatch
                            ? project.studentBatch.name
                            : 'Select a batch'
                    }
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {studentBatches
                        ? studentBatches.map((batche) => (
                              <SelectItem key={batche.id} value={batche.id}>
                                  {batche.name}
                              </SelectItem>
                          ))
                        : null}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
