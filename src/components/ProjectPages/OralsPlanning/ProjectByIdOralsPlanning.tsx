import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { setCurrentProject, updateProjectInList } from '@/store/project.slice'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Settings, Users } from 'lucide-react'

import { toast } from 'sonner'
import { EditProjectDto } from '@/components/ManageProjects/types.ts'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import { ConfigurationSection } from '@/components/ProjectPages/ProjectGroups/ConfigurationSection.tsx'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import OralPlanningComposition from '@/components/ProjectPages/OralsPlanning/OralPlanningComposition.tsx'

import { OralSettingsDialog } from '@/components/ProjectPages/OralsPlanning/OralSettingsUpdateModal.tsx'

const initialData: EditProjectDto = {}
export default function ProjectByIdOralsPlanning() {
    const { currentProject } = useSelector((state: RootState) => state.project)
    const { currentUser } = useSelector((state: RootState) => state.user)
    const dispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(false)
    const [project, setProject] = useState<EditProjectDto>(initialData)
    const [showModal, setShowModal] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{
        oralsConfigEndTime?: boolean
        oralsConfigStartTime?: boolean
        oralsConfigDuration?: boolean
    }>({})

    useEffect(() => {
        // Initialize form data with current project data
        if (currentProject) {
            setProject({
                oralsConfigEndTime: currentProject.oralsConfigEndTime,
                oralsConfigStartTime: currentProject.oralsConfigStartTime,
                oralsConfigDuration: currentProject.oralsConfigDuration,
            })
        }
    }, [currentProject])

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    const clearFieldError = (fieldName: keyof typeof fieldErrors) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => ({
                ...prev,
                [fieldName]: false,
            }))
        }
    }

    const validateConfiguration = (dto: EditProjectDto) => {
        const errors: string[] = []
        const newFieldErrors: typeof fieldErrors = {}
        console.log(dto)
        const projectDTO = dto

        // required
        const endTime =
            projectDTO.oralsConfigEndTime || currentProject.oralsConfigEndTime
        if (!endTime) {
            errors.push('Orals end date time must be selected')
            newFieldErrors.oralsConfigEndTime = true
        }

        // REQUIREd
        const oralsConfigStartTime =
            projectDTO.oralsConfigStartTime ||
            currentProject.oralsConfigStartTime
        if (!oralsConfigStartTime) {
            errors.push('Orals start date time must be selected')
            newFieldErrors.oralsConfigStartTime = true
        }

        // optional but other fields required if this one is set
        const duration =
            projectDTO.oralsConfigDuration || currentProject.oralsConfigDuration
        if (duration) {
            if (!oralsConfigStartTime || !endTime) {
                errors.push(
                    'Start Time and Endtime are required field when setting up duration.'
                )
                newFieldErrors.oralsConfigStartTime = true
                newFieldErrors.oralsConfigEndTime = true
            }
        }

        return { errors, fieldErrors: newFieldErrors }
    }

    // Perform the actual save operation
    const performSave = async (dto: EditProjectDto) => {
        setIsLoading(true)
        try {
            const response = await projectService.editProject(
                currentProject.id,
                dto
            )
            if (response.success) {
                if (response.data && !(response.data instanceof Array)) {
                    const updatedProject = response.data
                    // Update Redux store with the new project data
                    dispatch(setCurrentProject(updatedProject))
                    dispatch(updateProjectInList(updatedProject))

                    toast.success('Configuration updated successfully')
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong when updating')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleProjectEditSave = async (dto: EditProjectDto) => {
        // Validate configuration before saving
        const validation = validateConfiguration(dto)
        if (validation.errors.length > 0) {
            // Show all validation errors
            validation.errors.forEach((error: string) => toast.error(error))
            // Set field errors to highlight problematic fields
            setFieldErrors(validation.fieldErrors)
            return
        }

        // Clear any existing field errors on successful validation
        setFieldErrors({})
        await performSave(dto)
    }

    const handleCancelSave = () => {
        setShowModal(false)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 shrink-0 items-center gap-2 px-4">
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink
                                    href="/projects"
                                    className="flex items-center gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Orals planning
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="container mx-auto p-6 space-y-8">
                {/* Page Header */}
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Orals planning
                        </h1>
                        {currentUser?.role !== 'STUDENT' && (
                            <p className="text-muted-foreground">
                                Plan the orals for the groups
                            </p>
                        )}
                    </div>
                    <div className="space-x-1">
                        <Button>Attendance sheet</Button>
                        <Button>Planning sheet</Button>
                    </div>
                </div>

                {/* Group Composition */}
                <ConfigurationSection
                    title="Orals planning table"
                    description="Manage orals order for all groups"
                    className="lg:col-span-full"
                >
                    <OralPlanningComposition
                        currentProject={currentProject}
                        toggleModalSettings={() => setShowModal(!showModal)}
                    />
                </ConfigurationSection>
            </div>

            {/* Change project orals settings modal */}
            <OralSettingsDialog
                showConfirmDialog={showModal}
                setShowConfirmDialog={setShowModal}
                projectDTO={project}
                setProject={setProject}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
                isLoading={isLoading}
                handleCancelSave={handleCancelSave}
                onSave={handleProjectEditSave}
            />
        </div>
    )
}
