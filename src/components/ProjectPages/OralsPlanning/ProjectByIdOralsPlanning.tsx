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
import { ChangeEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button.tsx'
import { AlertTriangle, Settings, Users } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DateTime } from 'luxon'
import { toast } from 'sonner'
import ProjectGroupsComposition from '@/components/ProjectPages/ProjectGroups/ProjectGroupsComposition.tsx'
import { EditProjectDto } from '@/components/ManageProjects/types.ts'
import {
    groupService,
    projectService,
} from '@/services/ProjectService/project-api-client.ts'
import { ConfigurationSection } from '@/components/ProjectPages/ProjectGroups/ConfigurationSection.tsx'
import { StatusIndicator } from '@/components/ProjectPages/ProjectGroups/StatusIndicator.tsx'
import { Card, CardContent } from '@/components/ui/card'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import OralPlanningComposition from '@/components/ProjectPages/OralsPlanning/OralPlanningComposition.tsx'

const initialData: EditProjectDto = {}
export default function ProjectByIdOralsPlanning() {
    const { currentProject } = useSelector((state: RootState) => state.project)
    const { currentUser } = useSelector((state: RootState) => state.user)
    const dispatch = useDispatch()
    const { projectId } = useParams<{ projectId: string }>()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deadLine, setDate] = useState<Date | undefined>(undefined)
    const [deadLineTime, setDeadLineTime] = useState(
        DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    )
    const [groupProjectData, setGroupProjectData] =
        useState<EditProjectDto>(initialData)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [, setHasStudentsInGroups] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{
        groupsCreator?: boolean
        minPerGroup?: boolean
        maxPerGroup?: boolean
        creationGroupDeadLineDate?: boolean
    }>({})

    useEffect(() => {
        // Initialize form data with current project data
        if (currentProject) {
            setGroupProjectData({
                groupsCreator: currentProject.groupsCreator,
                maxPerGroup: currentProject.maxPerGroup,
                minPerGroup: currentProject.minPerGroup,
                creationGroupDeadLineDate:
                    currentProject.creationGroupDeadLineDate,
            })

            if (currentProject.creationGroupDeadLineDate) {
                const date = DateTime.fromISO(
                    currentProject.creationGroupDeadLineDate
                )
                setDate(date.toJSDate())
                setDeadLineTime(date.toFormat('HH:mm:ss'))
            }
        }
    }, [currentProject])

    useEffect(() => {
        // Track if there are unsaved changes
        if (currentProject) {
            const hasChanges =
                groupProjectData.groupsCreator !==
                    currentProject.groupsCreator ||
                groupProjectData.maxPerGroup !== currentProject.maxPerGroup ||
                groupProjectData.minPerGroup !== currentProject.minPerGroup ||
                groupProjectData.creationGroupDeadLineDate !==
                    currentProject.creationGroupDeadLineDate
            setHasUnsavedChanges(hasChanges)
        }
    }, [groupProjectData, currentProject])

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget

        // Handle numeric fields properly
        let processedValue: string | number = value
        if (id === 'minPerGroup' || id === 'maxPerGroup') {
            const numValue = parseInt(value)
            processedValue = isNaN(numValue) || value === '' ? '' : numValue
        }

        setGroupProjectData((prev) => ({
            ...prev,
            [id]: processedValue,
        }))

        // Clear field error when user starts typing
        if (fieldErrors[id as keyof typeof fieldErrors]) {
            setFieldErrors((prev) => ({
                ...prev,
                [id]: false,
            }))
        }
    }

    const clearFieldError = (fieldName: keyof typeof fieldErrors) => {
        if (fieldErrors[fieldName]) {
            setFieldErrors((prev) => ({
                ...prev,
                [fieldName]: false,
            }))
        }
    }

    const validateConfiguration = () => {
        const errors: string[] = []
        const newFieldErrors: typeof fieldErrors = {}

        // Check if Group Creation Method is selected
        const groupsCreator =
            groupProjectData.groupsCreator || currentProject.groupsCreator
        if (!groupsCreator) {
            errors.push('Group Creation Method must be selected')
            newFieldErrors.groupsCreator = true
        }

        // Check if minimum students per group is set
        const minPerGroup =
            groupProjectData.minPerGroup || currentProject.minPerGroup
        if (!minPerGroup || minPerGroup < 1) {
            errors.push(
                'Minimum students per group is required and must be at least 1'
            )
            newFieldErrors.minPerGroup = true
        }

        // Check if maximum students per group is set
        const maxPerGroup =
            groupProjectData.maxPerGroup || currentProject.maxPerGroup
        if (!maxPerGroup || maxPerGroup < 1) {
            errors.push(
                'Maximum students per group is required and must be at least 1'
            )
            newFieldErrors.maxPerGroup = true
        }

        // Check if min is not greater than max
        if (minPerGroup && maxPerGroup && minPerGroup > maxPerGroup) {
            errors.push(
                'Minimum students per group cannot be greater than maximum'
            )
            newFieldErrors.minPerGroup = true
            newFieldErrors.maxPerGroup = true
        }

        // Check if deadline is set when Group Creation Method is STUDENT
        if (groupsCreator === 'STUDENT') {
            const deadline =
                groupProjectData.creationGroupDeadLineDate ||
                currentProject.creationGroupDeadLineDate
            if (!deadline) {
                errors.push(
                    'Group Creation Deadline is required when students create their own groups'
                )
                newFieldErrors.creationGroupDeadLineDate = true
            }
        }

        return { errors, fieldErrors: newFieldErrors }
    }

    // Check if there are students in existing groups
    const checkForStudentsInGroups = async (): Promise<boolean> => {
        try {
            const response = await groupService.getAll(
                projectId || currentProject.id
            )
            if (response.success && response.data) {
                const groups = response.data as ProjectGroup[]
                const hasStudents = groups.some((group) => {
                    // Add null check for group object
                    if (!group || !group.studentsIds) {
                        return false
                    }
                    const studentIds = group.studentsIds
                        .split(',')
                        .filter(Boolean)
                    return studentIds.length > 0
                })
                return hasStudents
            }
        } catch (error) {
            console.error('Error checking for students in groups:', error)
        }
        return false
    }

    // Perform the actual save operation
    const performSave = async () => {
        setIsLoading(true)
        try {
            const response = await projectService.editProject(
                currentProject.id,
                groupProjectData
            )
            if (response.success) {
                if (response.data && !(response.data instanceof Array)) {
                    const updatedProject = response.data
                    // Update Redux store with the new project data
                    dispatch(setCurrentProject(updatedProject))
                    dispatch(updateProjectInList(updatedProject))

                    toast.success('Configuration updated successfully')
                    setHasUnsavedChanges(false)
                    // Trigger group refresh
                    setRefreshTrigger((prev) => prev + 1)
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

    const handleProjectEditSave = async () => {
        // Validate configuration before saving
        const validation = validateConfiguration()
        if (validation.errors.length > 0) {
            // Show all validation errors
            validation.errors.forEach((error: string) => toast.error(error))
            // Set field errors to highlight problematic fields
            setFieldErrors(validation.fieldErrors)
            return
        }

        // Clear any existing field errors on successful validation
        setFieldErrors({})

        // Check if there are students in groups
        const hasStudents = await checkForStudentsInGroups()
        setHasStudentsInGroups(hasStudents)

        if (hasStudents) {
            // Show confirmation dialog
            setShowConfirmDialog(true)
        } else {
            // Proceed with save directly
            await performSave()
        }
    }

    // Handle confirmation dialog
    const handleConfirmSave = async () => {
        setShowConfirmDialog(false)
        await performSave()
    }

    const handleCancelSave = () => {
        setShowConfirmDialog(false)
    }

    const getDeadlineStatus = () => {
        if (!currentProject.creationGroupDeadLineDate) return null

        const deadline = DateTime.fromISO(
            currentProject.creationGroupDeadLineDate
        )
        const now = DateTime.now()
        const timeUntil = deadline.diff(now)

        if (timeUntil.milliseconds < 0) {
            return {
                type: 'error' as const,
                text: 'Deadline passed',
                description: deadline.toFormat('dd/MM/yyyy HH:mm'),
            }
        }

        if (timeUntil.as('days') < 1) {
            return {
                type: 'warning' as const,
                text: 'Due soon',
                description: deadline.toFormat('dd/MM/yyyy HH:mm'),
            }
        }

        return {
            type: 'info' as const,
            text: 'Active',
            description: deadline.toFormat('dd/MM/yyyy HH:mm'),
        }
    }

    const deadlineStatus = getDeadlineStatus()

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
                        refreshTrigger={refreshTrigger}
                    />
                </ConfigurationSection>
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Confirm Configuration Changes
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            <p>
                                There are already students assigned to groups in
                                this project. Changing the group configuration
                                may affect existing group assignments.
                            </p>
                            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                    ⚠️ Warning: Students may be removed from
                                    groups if the new configuration doesn't
                                    allow their current group size or structure.
                                </p>
                            </div>
                            <p className="text-sm">
                                Do you want to proceed with saving the
                                configuration changes?
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelSave}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmSave}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                'Yes, Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
