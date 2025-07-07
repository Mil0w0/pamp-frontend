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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { setCurrentProject, updateProjectInList } from '@/store/project.slice'
import { ChangeEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import {
    AlertTriangle,
    Calendar,
    ChevronDownIcon,
    Clock,
    Save,
    Settings,
    Users,
} from 'lucide-react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
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

const initialData: EditProjectDto = {}

export default function ProjectByIdPageGroupConfig() {
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
    const [setHasStudentsInGroups] = useState(false)
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
                    const studentIds = (group.studentsIds ?? '')
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
                                    Group Configuration
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="container mx-auto p-6 space-y-8">
                {/* Page Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Group Configuration
                    </h1>
                    <p className="text-muted-foreground">
                        Configure how groups are created and managed for this
                        project.
                    </p>
                </div>

                {/* Student View */}
                {currentUser?.role === 'STUDENT' ? (
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        Students have until{' '}
                                        <strong>
                                            {DateTime.fromISO(
                                                currentProject.creationGroupDeadLineDate
                                            ).toFormat('dd/MM/yyyy HH:mm')}
                                        </strong>{' '}
                                        to create groups of{' '}
                                        {currentProject.minPerGroup} to{' '}
                                        {currentProject.maxPerGroup} students.
                                    </p>
                                    {deadlineStatus && (
                                        <StatusIndicator
                                            type={deadlineStatus.type}
                                            icon="calendar"
                                            text={deadlineStatus.text}
                                            description={
                                                deadlineStatus.description
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Teacher Configuration */
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Group Creator Configuration */}
                        <ConfigurationSection
                            title="Group Creation Method"
                            description="Choose who can create and manage groups"
                            status={
                                fieldErrors.groupsCreator
                                    ? 'error'
                                    : groupProjectData.groupsCreator ===
                                        'STUDENT'
                                      ? 'custom-purple'
                                      : 'bg-card'
                            }
                            statusText={
                                fieldErrors.groupsCreator
                                    ? 'Required'
                                    : groupProjectData.groupsCreator ===
                                        'TEACHER'
                                      ? 'Manual'
                                      : groupProjectData.groupsCreator ===
                                          'STUDENT'
                                        ? 'Student-led'
                                        : 'Automatic'
                            }
                        >
                            <RadioGroup
                                value={
                                    groupProjectData.groupsCreator ||
                                    currentProject.groupsCreator
                                }
                                onValueChange={(value: string) => {
                                    setGroupProjectData((prev) => ({
                                        ...prev,
                                        groupsCreator: value as
                                            | 'TEACHER'
                                            | 'RANDOM'
                                            | 'STUDENT',
                                    }))
                                    clearFieldError('groupsCreator')
                                }}
                                className="space-y-3"
                            >
                                <Label
                                    htmlFor="teacher"
                                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${fieldErrors.groupsCreator ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}
                                >
                                    <RadioGroupItem
                                        value="TEACHER"
                                        id="teacher"
                                    />
                                    <div className="flex-1 flex flex-row gap-4 items-center">
                                        <div className="font-medium">
                                            Teacher
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            You manually assign students to
                                            groups
                                        </div>
                                    </div>
                                </Label>
                                <Label
                                    htmlFor="student"
                                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${fieldErrors.groupsCreator ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}
                                >
                                    <RadioGroupItem
                                        value="STUDENT"
                                        id="student"
                                    />
                                    <div className="flex-1 flex flex-row gap-4 items-center">
                                        <div className="font-medium">
                                            Students
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Students form their own groups
                                            before deadline
                                        </div>
                                    </div>
                                </Label>
                                <Label
                                    htmlFor="random"
                                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${fieldErrors.groupsCreator ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}
                                >
                                    <RadioGroupItem
                                        value="RANDOM"
                                        id="random"
                                    />
                                    <div className="flex-1 flex flex-row gap-4 items-center">
                                        <div className="font-medium">
                                            System (Automatic)
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Groups are created randomly by the
                                            system
                                        </div>
                                    </div>
                                </Label>
                            </RadioGroup>
                        </ConfigurationSection>

                        {/* Group Size Configuration */}
                        <ConfigurationSection
                            title="Group Size Limits"
                            description="Set minimum and maximum students per group"
                            status={
                                fieldErrors.minPerGroup ||
                                fieldErrors.maxPerGroup
                                    ? 'error'
                                    : 'bg-card'
                            }
                            statusText={
                                fieldErrors.minPerGroup ||
                                fieldErrors.maxPerGroup
                                    ? 'Invalid'
                                    : 'Required'
                            }
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="minPerGroup"
                                        className="text-sm font-medium"
                                    >
                                        Minimum students
                                    </Label>
                                    <Input
                                        id="minPerGroup"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={
                                            groupProjectData.minPerGroup ||
                                            currentProject.minPerGroup
                                        }
                                        onChange={handleChange}
                                        className={`h-10 ${fieldErrors.minPerGroup ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="maxPerGroup"
                                        className="text-sm font-medium"
                                    >
                                        Maximum students
                                    </Label>
                                    <Input
                                        id="maxPerGroup"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={
                                            groupProjectData.maxPerGroup ||
                                            currentProject.maxPerGroup
                                        }
                                        onChange={handleChange}
                                        className={`h-10 ${fieldErrors.maxPerGroup ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                        </ConfigurationSection>

                        {/* Deadline Configuration (only if students create groups) */}
                        {(groupProjectData.groupsCreator === 'STUDENT' ||
                            (!groupProjectData.groupsCreator &&
                                currentProject.groupsCreator ===
                                    'STUDENT')) && (
                            <ConfigurationSection
                                title="Group Creation Deadline"
                                description="Set when students must complete group formation"
                                status={
                                    fieldErrors.creationGroupDeadLineDate
                                        ? 'error'
                                        : deadlineStatus?.type === 'error'
                                          ? 'error'
                                          : deadlineStatus?.type === 'warning'
                                            ? 'warning'
                                            : 'custom-purple'
                                }
                                statusText={
                                    fieldErrors.creationGroupDeadLineDate
                                        ? 'Required'
                                        : deadlineStatus?.text || 'Not set'
                                }
                                className="lg:col-span-2"
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label
                                            htmlFor="deadline-date"
                                            className="text-sm font-medium"
                                        >
                                            Deadline Date
                                        </Label>
                                        <Popover
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    id="deadline-date"
                                                    className={`w-full justify-between h-10 font-normal ${fieldErrors.creationGroupDeadLineDate ? 'border-red-500 focus:border-red-500' : ''}`}
                                                    disabled={isLoading}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {groupProjectData.creationGroupDeadLineDate
                                                            ? DateTime.fromISO(
                                                                  groupProjectData.creationGroupDeadLineDate
                                                              ).toFormat(
                                                                  'dd/MM/yyyy'
                                                              )
                                                            : currentProject.creationGroupDeadLineDate
                                                              ? DateTime.fromISO(
                                                                    currentProject.creationGroupDeadLineDate
                                                                ).toFormat(
                                                                    'dd/MM/yyyy'
                                                                )
                                                              : 'Select date'}
                                                    </div>
                                                    <ChevronDownIcon className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <CalendarComponent
                                                    mode="single"
                                                    captionLayout="dropdown"
                                                    selected={deadLine}
                                                    onSelect={(selected) => {
                                                        if (selected) {
                                                            const [
                                                                hourStr,
                                                                minuteStr,
                                                                secondStr = '0',
                                                            ] =
                                                                deadLineTime.split(
                                                                    ':'
                                                                )
                                                            const formattedDate =
                                                                DateTime.fromJSDate(
                                                                    selected
                                                                ).set({
                                                                    hour: parseInt(
                                                                        hourStr
                                                                    ),
                                                                    minute: parseInt(
                                                                        minuteStr
                                                                    ),
                                                                    second: parseInt(
                                                                        secondStr
                                                                    ),
                                                                })

                                                            const isoString =
                                                                formattedDate.toISO()
                                                            setGroupProjectData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    creationGroupDeadLineDate:
                                                                        isoString ||
                                                                        undefined,
                                                                })
                                                            )
                                                            clearFieldError(
                                                                'creationGroupDeadLineDate'
                                                            )
                                                        }
                                                        setOpen(false)
                                                        setDate(selected)
                                                    }}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <Label
                                            htmlFor="deadline-time"
                                            className="text-sm font-medium"
                                        >
                                            Deadline Time
                                        </Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="time"
                                                id="deadline-time"
                                                step="1"
                                                value={deadLineTime}
                                                onChange={(e) => {
                                                    const newTime =
                                                        e.target.value
                                                    setDeadLineTime(newTime)

                                                    if (deadLine) {
                                                        const formattedDate =
                                                            DateTime.fromJSDate(
                                                                deadLine
                                                            ).toFormat(
                                                                'yyyy-MM-dd'
                                                            )
                                                        const combined = `${formattedDate}T${newTime}`

                                                        setGroupProjectData(
                                                            (prev) => ({
                                                                ...prev,
                                                                creationGroupDeadLineDate:
                                                                    combined,
                                                            })
                                                        )
                                                    }
                                                    clearFieldError(
                                                        'creationGroupDeadLineDate'
                                                    )
                                                }}
                                                disabled={isLoading}
                                                className={`h-10 pl-10 ${fieldErrors.creationGroupDeadLineDate ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {deadlineStatus && (
                                    <div className="mt-4">
                                        <StatusIndicator
                                            type={deadlineStatus.type}
                                            icon="calendar"
                                            text={deadlineStatus.text}
                                            description={
                                                deadlineStatus.description
                                            }
                                        />
                                    </div>
                                )}
                            </ConfigurationSection>
                        )}
                    </div>
                )}

                {/* Save Button */}
                {currentUser?.role !== 'STUDENT' && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex-1">
                            {hasUnsavedChanges ? (
                                <StatusIndicator
                                    type="warning"
                                    icon="alert"
                                    text="Unsaved changes"
                                    description="Don't forget to save your configuration"
                                />
                            ) : (
                                <StatusIndicator
                                    type="success"
                                    icon="check"
                                    text="All changes saved"
                                />
                            )}
                        </div>
                        <Button
                            onClick={handleProjectEditSave}
                            disabled={isLoading || !hasUnsavedChanges}
                            className="min-w-[120px]"
                        >
                            {isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Group Composition */}
                <ConfigurationSection
                    title="Group Composition"
                    description="Manage student assignments and group membership"
                    className="lg:col-span-full"
                >
                    <ProjectGroupsComposition
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
