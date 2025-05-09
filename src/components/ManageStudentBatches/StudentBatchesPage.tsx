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
import { StudentBatches } from '@/components/ManageStudentBatches/types.ts'
import PampButton from '@/components/ui/pamp-button.tsx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { useNavigate } from 'react-router'
export default function StudentBatchesPage() {
    const navigate = useNavigate()
    const studentBatches: StudentBatches = [
        {
            id: 'ziohf28d',
            state: 'Active',
            name: 'Classe AL1',
            students: 42,
            createdAt: new Date(),
            tags: 'ESGI',
        },
        {
            id: 'ziohf29d',
            state: 'Inactive',
            name: 'Classe AL2',
            students: 25,
            createdAt: new Date(),
            tags: 'ESGI',
        },
    ]

    function goToStudentBatchesById(id: string) {
        navigate(`/student-batches/${id}`)
    }

    return (
        <div className="p-24 flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-2xl font-semibold">My student batches</h1>
                <PampButton
                    message={'New batch'}
                    onClick={() => {
                        toast('New batch not implemented yet')
                    }}
                />
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
                    {studentBatches.map((batch) => (
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
                            <TableCell>{batch.students}</TableCell>
                            <TableCell>
                                {batch.createdAt.toDateString()}
                            </TableCell>
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
                                        >
                                            Delete this
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            style={{ cursor: 'pointer' }}
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
