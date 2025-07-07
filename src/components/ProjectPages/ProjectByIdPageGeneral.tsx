import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import StudentBatchAssignementSelector from '@/components/ManageProjects/StudentBatchAssignementSelector.tsx'

export default function ProjectByIdPageGeneral() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)
    const { currentUser } = useSelector((state: RootState) => state.user)

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (currentUser) {
            dispatch(fetchAllProjects(currentUser.user_id))
        }
    }, [dispatch, projectId, currentUser])

    if (!currentProject) {
        return <Skeleton />
    }

    const publishProject = async () => {
        if (!currentProject) return
        if (!projectId) return
        try {
            const response = await projectService.editProject(
                currentProject.id,
                {
                    isPublished: !currentProject.isPublished,
                }
            )
            if (response.success) {
                toast.success(
                    'Successfully published. Students will receive a mail '
                )
                dispatch(fetchProjectById(projectId))
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
        }
    }
    return (
        <div>
            <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/projects">
                                    Projects
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    General settings
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-2xl">Title: {currentProject.name}</h1>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div>
                        <h2 className="text-lg font-semibold">Description</h2>
                        <p className="text-sm">{currentProject.description}</p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">
                            From student batch
                        </h2>
                        <p className="text-sm">
                            {currentProject.studentBatch
                                ? currentProject.studentBatch.name
                                : 'UNASSIGNED'}
                        </p>
                    </div>

                    <div className="grid w-full max-w-sm justify-end">
                        <Label htmlFor="studentsExcel" className="mb-1">
                            Upload project syllabus
                        </Label>
                        <Input id="uploadProject" type="file" />
                    </div>
                </div>

                <Separator className="my-4" />
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            Assign Promotion
                        </h2>
                        <StudentBatchAssignementSelector
                            project={currentProject}
                            userIsStudent={currentUser?.role === 'STUDENT'}
                            onSuccess={() => {
                                if (projectId) {
                                    dispatch(fetchProjectById(projectId))
                                }
                            }}
                        />
                    </div>

                    {/*separator with a section title "Publishing the project"*/}
                    <Separator className="my-4" />
                    <h2 className="text-lg font-semibold">
                        Publishing the project
                    </h2>

                    <Button
                        onClick={() => publishProject()}
                        className="w-fit"
                        variant={
                            currentProject?.isPublished ? 'outline' : 'default'
                        }
                    >
                        {currentProject?.isPublished
                            ? 'Unpublish project'
                            : 'Publish project'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
