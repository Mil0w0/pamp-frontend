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
import { toast } from 'sonner'
import PampButton from '@/components/ui/pamp-button.tsx'
import { useNavigate } from 'react-router'
import { CreateProjectDto } from '@/components/ManageProjects/types.ts'
import { projectService } from '@/services/ProjectService/project-api-client.ts'

export default function AddProjectModal() {
    const navigate = useNavigate()
    const [openModal, setOpenModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [projectData, setprojectData] = useState<CreateProjectDto>({
        name: '',
        description: '',
    })
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        setprojectData((prev) => ({ ...prev, [id]: value }))
    }

    async function createProject() {
        try {
            const response = await projectService.createProject(projectData)
            if (response.success) {
                if (response.data && !(response.data instanceof Array)) {
                    const id = response.data.id
                    toast.success('Successfully created')
                    navigate(`/projects/${id}/settings`)
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
                <PampButton message={'New project'} />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new project</DialogTitle>
                    <DialogDescription>
                        One project is linked to one student batch. Copy it and
                        change the studentBatch if u want to re-use it.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3">
                    <Label htmlFor="firstName">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Ex: Projet ZA"
                        required
                        onChange={handleChange}
                    />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="firstName">Description</Label>
                    <Input
                        id="description"
                        type="text"
                        placeholder="Ex: This is a project"
                        required
                        onChange={handleChange}
                    />
                </div>
                <Button
                    style={{ cursor: 'pointer' }}
                    type="submit"
                    className="w-full"
                    onClick={() => createProject()}
                    disabled={isLoading}
                >
                    Create
                </Button>
            </DialogContent>
        </Dialog>
    )
}
