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
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { formatToShortDate } from '@/utils/dateFormatter.ts'
import { Project } from '@/components/ManageProjects/types.ts'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import AddProjectModal from '@/components/ManageProjects/AddProjectsModal.tsx'
import StudentBatchAssignementSelector from '@/components/ManageProjects/StudentBatchAssignementSelector.tsx'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'

export default function ProjectsPage() {
    const navigate = useNavigate()
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<Project[] | null>(null)

    function goToProjectById(id: string) {
        if (currentUser?.role === 'TEACHER') {
            navigate(`/projects/${id}/settings`)
        } else {
            navigate(`/projects/${id}/groups`)
        }
    }

    async function getProjects(): Promise<Project[]> {
        setIsLoading(true)
        if (!currentUser) {
            return []
        }
        try {
            const response = await projectService.getAll(currentUser.user_id)
            if (response.success) {
                return response.data as Project[]
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
            const response = await projectService.deleteProject(itemId)
            if (response.success) {
                toast.success('Deleted succesfully')
                //remove item from list visually
                if (projects !== undefined && projects?.length) {
                    const updatedBatches = projects.filter(
                        (batch) => batch.id !== itemId
                    )
                    setProjects(updatedBatches)
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
        getProjects().then((data) => {
            setProjects(data)
        })
    }, [currentUser])

    async function copyProject(itemId: string) {
        setIsLoading(true)
        try {
            const response = await projectService.copyProject(itemId)
            if (response.success) {
                toast.success('Copied successfully')
                const copiedProject = response.data as Project
                navigate(`/projects/${copiedProject.id}/settings`)
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (!currentUser || !projects) {
        return (
            <LoadingSpinner
                className={'w-full h-[calc(100vh-6rem)] self-center'}
            />
        )
    }

    return (
        <div className="p-24 flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-2xl font-semibold">My projects</h1>
                {currentUser.role === 'STUDENT' ? '' : <AddProjectModal />}
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">State</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Attached to</TableHead>
                        <TableHead>Created at</TableHead>
                        {currentUser.role === 'STUDENT' ? (
                            ''
                        ) : (
                            <TableHead>Actions</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects?.length === 0 ? (
                        <TableRow>
                            <TableCell>
                                {currentUser.role === 'STUDENT'
                                    ? 'There are no projects available yet. You will receive a mail when there are some.'
                                    : 'Nothing yet, add your first project.'}
                            </TableCell>
                        </TableRow>
                    ) : (
                        projects?.map((project) => (
                            <TableRow
                                key={project.id}
                                className="h-4 cursor-pointer"
                                onClick={() => goToProjectById(project.id)}
                            >
                                <TableCell className="font-medium">
                                    <Badge
                                        variant={
                                            project.isPublished
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {project.isPublished
                                            ? 'PUBLISHED'
                                            : 'DRAFT'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{project.name}</TableCell>
                                <TableCell className="cursor-pointer">
                                    <StudentBatchAssignementSelector
                                        project={project}
                                        userIsStudent={
                                            currentUser?.role === 'STUDENT'
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                    {formatToShortDate(project.createdAt)}
                                </TableCell>
                                {currentUser.role === 'STUDENT' ? (
                                    ''
                                ) : (
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
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
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                        deleteItem(project.id)
                                                    }
                                                >
                                                    Delete this
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                        goToProjectById(
                                                            project.id
                                                        )
                                                    }
                                                >
                                                    Modify this
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                        copyProject(project.id)
                                                    }
                                                >
                                                    Copy this
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
