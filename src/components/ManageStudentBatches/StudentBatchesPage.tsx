import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge.tsx'
import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { useNavigate } from 'react-router'
import { batchService } from '@/services/UserService/auth-api-client.ts'
import { useEffect, useState } from 'react'
import AddStudentBatchModal from '@/components/ManageStudentBatches/AddStudentBatchModal.tsx'
import {formatToShortDate} from "@/utils/dateFormatter.ts";
export default function StudentBatchesPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [studentBatches, setStudentBatches] = useState<StudentBatch[] | null>(
        null
    )

    function goToStudentBatchesById(id: string) {
        navigate(`/student-batches/${id}`)
    }

    async function getBatchesStudents(): Promise<StudentBatch[]> {
        setIsLoading(true)
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
        } finally {
            setIsLoading(false)
        }
    }

    async function deleteItem(itemId: string): Promise<void> {
        setIsLoading(true)
        try {
            const response = await batchService.deleteBatch(itemId)
            if (response.success) {
                toast.success('Deleted succesfully')
                //remove item from list visually
                if (studentBatches !== undefined && studentBatches?.length) {
                    const updatedBatches = studentBatches.filter(
                        (batch) => batch.id !== itemId
                    )
                    setStudentBatches(updatedBatches)
                }
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
        getBatchesStudents().then((data) => {
            setStudentBatches(data)
        })
    }, [])
    return (
        <div className="p-24 flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-2xl font-semibold">My student batches</h1>
                <AddStudentBatchModal />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">State</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Created at</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {studentBatches?.map((batch) => (
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
                            <TableCell>{batch.name}</TableCell>
                            <TableCell>{0}</TableCell> {/*TODO: add batch.students/length later*/}
                            <TableCell>{formatToShortDate(batch.createdAt)}</TableCell>
                            <TableCell>{batch.tags}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            style={{ cursor: 'pointer' }}
                                            variant="outline"
                                        >
                                            ...
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>
                                            I want to ...{' '}
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            style={{ cursor: 'pointer' }}
                                            disabled={isLoading}
                                            onClick={() => deleteItem(batch.id)}
                                        >
                                            Delete this
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            style={{ cursor: 'pointer' }}
                                            disabled={isLoading}
                                            onClick={() =>
                                                goToStudentBatchesById(batch.id)
                                            }
                                        >
                                            Modify this
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
