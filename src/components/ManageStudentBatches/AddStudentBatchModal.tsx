import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { ChangeEvent, useState } from 'react'
import { NewStudentBatch } from '@/components/ManageStudentBatches/types.ts'
import { toast } from 'sonner'
import PampButton from '@/components/ui/pamp-button.tsx'
import { useNavigate } from 'react-router'
import { batchService } from '@/services/UserService/auth-api-client.ts'

export default function AddStudentBatchModal() {
    const navigate = useNavigate()
    const [openModal, setOpenModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [studentBatchData, setstudentBatchData] = useState<NewStudentBatch>({
        name: '',
    })
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        setstudentBatchData((prev) => ({ ...prev, [id]: value }))
    }

    async function createNewStudentBatch() {
        try {
            const response = await batchService.createBatch(studentBatchData)
            if (response.success) {
                if (response.data && !(response.data instanceof Array)) {
                    const id = response.data.id
                    toast.success('Successfully created')
                    navigate(`/student-batches/${id}`)
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
                <PampButton message={'New batch'} />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new promotion</DialogTitle>
                    <DialogDescription>
                        Name it now and add students to it right after.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3">
                    <Label htmlFor="firstName">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Ex: Promotion Z"
                        required
                        onChange={handleChange}
                    />
                </div>
                <Button
                    style={{ cursor: 'pointer' }}
                    variant="secondary"
                    type="submit"
                    className="w-full"
                    onClick={() => createNewStudentBatch()}
                    disabled={isLoading}
                >
                    Create
                </Button>
            </DialogContent>
        </Dialog>
    )
}
