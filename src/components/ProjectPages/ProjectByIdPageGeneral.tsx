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
import { ChangeEvent, useEffect, useState } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import StudentBatchAssignementSelector from '@/components/ManageProjects/StudentBatchAssignementSelector.tsx'
import { DownloadIcon, FileIcon, Upload } from 'lucide-react'
import {
    createS3UploadForSyllabus,
    downloadS3File,
} from '@/utils/fileUpload.ts'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'
import { Card, CardContent } from '@/components/ui/card.tsx'

export default function ProjectByIdPageGeneral() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [file, setFile] = useState<File | null>(null)

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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        console.log('selectedFile', selectedFile)
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    const uploadSyllabus = async () => {
        if (!currentProject) return
        if (!file) return
        try {
            const fileUploaded = createS3UploadForSyllabus(currentProject.id)
            const syllabusUrl = await fileUploaded(file)
            console.log(syllabusUrl)

            if (syllabusUrl) {
                //EDIT PROJECT
                const response = await projectService.editProject(
                    currentProject.id,
                    {
                        syllabusUrl: syllabusUrl,
                    }
                )
                if (response.success) {
                    toast.success('Successfully saved syllabus.')
                    dispatch(fetchProjectById(currentProject.id))
                } else {
                    toast.error(response.error)
                }
            }
        } catch (err) {
            const error = err as ApiErrorMessage
            console.error(err)
            toast.error(error.message)
        }
    }

    const downloadSyllabus = async () => {
        if (!currentProject) return
        console.log(currentProject) //FIXME : URL DOESNT START WITH S3://
        try {
            await downloadS3File(
                currentProject.syllabusUrl,
                `syllabus-project-${currentProject.name}`
            )
            toast.success('Syllabus download started')
        } catch (error) {
            console.error(error)
            toast.error("Couldn't download syllabus")
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
                </div>

                <Separator className="my-4" />

                <h2 className="text-lg font-semibold">Syllabus</h2>
                <div className="space-y-4">
                    {currentProject.syllabusUrl && (
                        <Card className="bg-white dark:bg-muted w-1/3">
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden cursor-pointer">
                                    <div className="flex bg-muted/50 px-4 py-3 border-b">
                                        <FileIcon className="mr-3" />
                                        <p>Download syllabus </p>
                                        <DownloadIcon
                                            className="ml-3"
                                            onClick={() => downloadSyllabus()}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="space-y-2">
                        <Label
                            htmlFor="file-upload"
                            className="text-base font-medium"
                        >
                            Upload a file
                        </Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors w-1/3">
                            <div className="flex flex-col items-center space-y-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <div className="text-center">
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Supported format: PDF
                                    </p>
                                </div>
                            </div>
                        </div>
                        {file && (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg w-1/3">
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={uploadSyllabus}
                        disabled={!file}
                        className="w-full sm:w-auto"
                    >
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                        </>
                    </Button>
                </div>
                <Separator className="my-4" />
                <div className="flex flex-col gap-4">
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
