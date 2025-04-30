import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge.tsx'
import { StudentBatches } from '@/components/ManageStudentBatches/types.ts'
export default function StudentBatchesPage() {
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
    return (
        <>
            <h1>My student batches</h1>
            {/*<PampButton />*/}
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
                        <TableRow key={batch.id}>
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
                            <TableCell>...</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}
