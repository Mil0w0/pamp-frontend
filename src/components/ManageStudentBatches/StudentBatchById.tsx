import { useParams } from 'react-router'
import { Error404 } from '@/components/Error/Error404.tsx'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { ChangeEvent, useEffect, useState } from 'react'
import { batchService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import {
    Student,
    StudentBatch,
} from '@/components/ManageStudentBatches/types.ts'
import StudentBatchDroppableContainers from '@/components/AddStudentToStudentBatch/StudentBatchDroppableContainers.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { formatToShortDate } from '@/utils/dateFormatter.ts'

export default function StudentBatchById() {
    const params = useParams()
    const studentBatchId = params.id || 'unknown'
    const [isLoading, setIsLoading] = useState(true)
    const [batch, setBatch] = useState<StudentBatch>({} as StudentBatch)
    const [batchEditData, setBatchEditData] = useState({} as StudentBatch)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        setBatchEditData((prev) => ({ ...prev, [id]: value }))
    }
    const updateSelectedStudents = (selectedStudents: Student[]) => {
        setBatchEditData((prev) => ({
            ...prev,
            students: [...selectedStudents],
        }))
    }

    async function getStudentBatchInfo(
        id: string
    ): Promise<StudentBatch | undefined> {
        try {
            const response = await batchService.getOneById(id)
            if (response.success) {
                return response.data as StudentBatch
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Une erreur est survenue.')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleEditBatch() {
        setIsLoading(true)
        try {
            const response = await batchService.editBatch(
                studentBatchId,
                batchEditData
            )
            if (response.success) {
                setBatch(response.data as StudentBatch)
                toast.success('Successfully edited.')
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getStudentBatchInfo(studentBatchId).then((batch) => {
            if (typeof batch !== 'undefined') {
                setBatch(batch)
                setBatchEditData({ students: batch.students } as StudentBatch) //ugly but i need it to display default selected students
            }
        })
    }, [studentBatchId])

    if (studentBatchId === 'unknown') {
        return <Error404 />
    }
    if (isLoading) {
        return 'is loading'
    }
    return (
        <div className="p-24 flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-2xl font-semibold w-1/4">
                    My student batch: <br />
                    <span className="text-lg font-semibold">{batch.name}</span>
                </h1>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">State</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Created at</TableHead>
                            <TableHead>Tags</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow key={batch.id} className="h-4">
                            <TableCell className="font-medium">
                                <Badge
                                    variant={
                                        batch.state.toUpperCase() === 'ACTIVE'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {batch.state}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Ex: Classe"
                                    required
                                    defaultValue={batch.name}
                                    onChange={handleChange}
                                />
                            </TableCell>
                            <TableCell>{batch.students.length}</TableCell>
                            <TableCell>
                                {formatToShortDate(batch.createdAt)}
                            </TableCell>
                            <TableCell>
                                <Input
                                    id="tags"
                                    type="text"
                                    placeholder="Ex: ESGI"
                                    required
                                    defaultValue={batch.tags}
                                    onChange={handleChange}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <StudentBatchDroppableContainers
                selectedStudents={batchEditData.students || []}
                setSelectedStudents={updateSelectedStudents}
            />

            <Button onClick={handleEditBatch}>Save this batch</Button>
        </div>
    )
}
