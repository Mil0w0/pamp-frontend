import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router'
import {
    projectService,
    reportDefinitionService,
} from '@/services/ProjectService/project-api-client'
import { submissionService } from '@/services/SubmissionService/submission-api-client'
import { authService } from '@/services/UserService/auth-api-client'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup, Step } from '@/components/ProjectPages/types'
import { ReportDefinition } from '@/services/ProjectService/types'
import { SubmissionResponse } from '@/services/SubmissionService/types'
import { Student } from '@/components/ManageStudentBatches/types'
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    FileText,
    SquareArrowOutUpRight,
    Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DateTime } from 'luxon'
import { downloadS3File } from '@/utils/fileUpload'
import { formatToShortDateAndTime } from '@/utils/dateFormatter'

interface ProjectWithDetails extends Project {
    myGroup?: ProjectGroup | null
    reportDefinition?: ReportDefinition | null
    nextStep?: {
        step: Step
        submission?: SubmissionResponse
        isLate: boolean
        daysUntilDeadline: number
    } | null
    groupMembers?: Student[]
}

export default function StudentDashboard() {
    const navigate = useNavigate()
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [projects, setProjects] = useState<ProjectWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (currentUser) {
            loadPublishedProjects()
        }
    }, [currentUser])

    const loadPublishedProjects = async () => {
        if (!currentUser) return

        try {
            // Get all projects for the student
            const response = await projectService.getAll(currentUser.user_id)
            if (response.success && response.data) {
                const allProjects = response.data as Project[]
                // Filter only published projects
                const publishedProjects = allProjects.filter(
                    (project) => project.isPublished
                )

                // Load additional details for each project
                const projectsWithDetails = await Promise.all(
                    publishedProjects.map(async (project) => {
                        const details: ProjectWithDetails = { ...project }

                        // Check if student is in a group for this project
                        const myGroup =
                            project.groups?.find((group) =>
                                group.studentsIds
                                    ?.split(',')
                                    .includes(currentUser.user_id)
                            ) || null
                        details.myGroup = myGroup

                        // Get report definition if exists
                        try {
                            const reportRes =
                                await reportDefinitionService.getReportDefinition(
                                    project.id
                                )
                            if (
                                reportRes.success &&
                                reportRes.data &&
                                reportRes.data.isActive
                            ) {
                                details.reportDefinition = reportRes.data
                            }
                        } catch (error) {
                            console.log(
                                'No report definition for project',
                                project.id,
                                error
                            )
                        }

                        // Get next step and submission status if user is in a group
                        if (myGroup && project.steps?.length > 0) {
                            const stepsWithSubmission = project.steps
                                .filter((step) => step.hasMandatorySubmission)
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            a.submissionDeadLine
                                        ).getTime() -
                                        new Date(b.submissionDeadLine).getTime()
                                )

                            for (const step of stepsWithSubmission) {
                                try {
                                    const submissionRes =
                                        await submissionService.getOneByStepAndGroup(
                                            step.id,
                                            project.id,
                                            myGroup.id
                                        )

                                    const hasSubmission =
                                        submissionRes.success &&
                                        submissionRes.data

                                    if (
                                        !hasSubmission &&
                                        step.submissionDeadLine
                                    ) {
                                        const deadline = DateTime.fromISO(
                                            step.submissionDeadLine
                                        )
                                        const now = DateTime.now()
                                        const daysUntil = Math.ceil(
                                            deadline.diff(now, 'days').days
                                        )
                                        const isLate = daysUntil < 0

                                        details.nextStep = {
                                            step,
                                            isLate,
                                            daysUntilDeadline: daysUntil,
                                        }
                                        break // Found the next unsubmitted step
                                    }
                                } catch (error) {
                                    console.log(
                                        'No submission found for step',
                                        step.id,
                                        error
                                    )
                                    if (step.submissionDeadLine) {
                                        const deadline = DateTime.fromISO(
                                            step.submissionDeadLine
                                        )
                                        const now = DateTime.now()
                                        const daysUntil = Math.ceil(
                                            deadline.diff(now, 'days').days
                                        )
                                        const isLate = daysUntil < 0

                                        details.nextStep = {
                                            step,
                                            isLate,
                                            daysUntilDeadline: daysUntil,
                                        }
                                        break
                                    }
                                }
                            }

                            // Get group members
                            if (myGroup.studentsIds) {
                                try {
                                    const studentsRes =
                                        await authService.getStudents()
                                    if (
                                        studentsRes.success &&
                                        studentsRes.data
                                    ) {
                                        const allStudents =
                                            studentsRes.data as Student[]
                                        const memberIds = myGroup.studentsIds
                                            .split(',')
                                            .map((id) => id.trim())
                                            .filter(Boolean)
                                        details.groupMembers =
                                            allStudents.filter((student) =>
                                                memberIds.includes(
                                                    student.user_id
                                                )
                                            )
                                    }
                                } catch (error) {
                                    console.log(
                                        'Error fetching group members',
                                        error
                                    )
                                }
                            }
                        }

                        return details
                    })
                )

                setProjects(projectsWithDetails)
            } else {
                toast.error(response.error || 'Failed to load projects')
            }
        } catch (error) {
            console.error('Error loading projects:', error)
            toast.error('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadSyllabus = async (project: Project) => {
        if (!project.syllabusUrl) return
        try {
            await downloadS3File(
                project.syllabusUrl,
                `syllabus-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}`
            )
            toast.success('Syllabus download started')
        } catch (error) {
            console.error(error)
            toast.error("Couldn't download syllabus")
        }
    }

    const handleOpenReport = (projectId: string, groupId: string) => {
        navigate(`/student/report/${projectId}/${groupId}`)
    }

    const getNextStepBadge = (nextStep: ProjectWithDetails['nextStep']) => {
        if (!nextStep) return null

        if (nextStep.isLate) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                </Badge>
            )
        } else if (nextStep.daysUntilDeadline <= 3) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Due soon
                </Badge>
            )
        } else {
            return (
                <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Upcoming
                </Badge>
            )
        }
    }

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    My Projects
                </h1>
                <p className="text-muted-foreground">
                    Access your published projects and track your progress
                </p>
            </div>

            {projects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No Published Projects
                        </h3>
                        <p className="text-muted-foreground text-center">
                            No projects have been published yet. You will
                            receive a notification when projects become
                            available.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="hover:shadow-lg transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {project.name}
                                            <Badge variant="default">
                                                Published
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {project.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {project.syllabusUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDownloadSyllabus(
                                                        project
                                                    )
                                                }
                                                className="w-fit"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Syllabus
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {/* Group Status */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Group Status
                                            </h4>
                                            {project.myGroup ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            {
                                                                project.myGroup
                                                                    .name
                                                            }
                                                        </span>
                                                        <Badge
                                                            variant="default"
                                                            className="gap-1"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                            Joined
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate(
                                                                `/projects/${project.id}/groups/${project.myGroup!.id}`
                                                            )
                                                        }
                                                        className="w-full"
                                                    >
                                                        View Group Details
                                                        <SquareArrowOutUpRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                        <span className="text-sm text-muted-foreground">
                                                            Not in a group yet
                                                        </span>
                                                    </div>
                                                    <Button
                                                        onClick={() =>
                                                            navigate(
                                                                `/projects/${project.id}/groups`
                                                            )
                                                        }
                                                        className="w-full"
                                                    >
                                                        <Users className="h-4 w-4 mr-2" />
                                                        Join a Group
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Next Step */}
                                        {project.myGroup && (
                                            <div className="space-y-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Next Step
                                                </h4>
                                                {project.nextStep ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                {
                                                                    project
                                                                        .nextStep
                                                                        .step
                                                                        .name
                                                                }
                                                            </span>
                                                            {getNextStepBadge(
                                                                project.nextStep
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Due:{' '}
                                                            {formatToShortDateAndTime(
                                                                project.nextStep
                                                                    .step
                                                                    .submissionDeadLine
                                                            )}
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/projects/${project.id}/steps/${project.nextStep!.step.id}`
                                                                )
                                                            }
                                                            className="w-full"
                                                        >
                                                            Work on Step
                                                            <SquareArrowOutUpRight className="h-4 w-4 ml-2" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span className="text-sm text-muted-foreground">
                                                            All steps completed
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Group Members */}
                                        {project.myGroup &&
                                            project.groupMembers && (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        Group Members (
                                                        {
                                                            project.groupMembers
                                                                .length
                                                        }
                                                        )
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {project.groupMembers.map(
                                                            (member) => (
                                                                <div
                                                                    key={
                                                                        member.user_id
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback className="text-xs">
                                                                            {
                                                                                member
                                                                                    .first_name[0]
                                                                            }
                                                                            {
                                                                                member
                                                                                    .last_name[0]
                                                                            }
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm">
                                                                        {
                                                                            member.first_name
                                                                        }{' '}
                                                                        {
                                                                            member.last_name
                                                                        }
                                                                    </span>
                                                                    {member.user_id ===
                                                                        currentUser?.user_id && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            You
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {/* Oral Presentation */}
                                        {project.myGroup?.oral && (
                                            <div className="space-y-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Oral Presentation
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            Start:
                                                        </span>{' '}
                                                        {formatToShortDateAndTime(
                                                            project.myGroup.oral
                                                                .startTime
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Duration:{' '}
                                                        {(() => {
                                                            const start =
                                                                DateTime.fromISO(
                                                                    project
                                                                        .myGroup
                                                                        .oral
                                                                        .startTime
                                                                )
                                                            const end =
                                                                DateTime.fromISO(
                                                                    project
                                                                        .myGroup
                                                                        .oral
                                                                        .endTime
                                                                )
                                                            const duration =
                                                                end.diff(
                                                                    start,
                                                                    [
                                                                        'hours',
                                                                        'minutes',
                                                                    ]
                                                                )
                                                            const hours =
                                                                Math.floor(
                                                                    duration.hours
                                                                )
                                                            const minutes =
                                                                Math.round(
                                                                    duration.minutes
                                                                )
                                                            return hours > 0
                                                                ? `${hours}h ${minutes}min`
                                                                : `${minutes}min`
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Report */}
                                        {project.myGroup &&
                                            project.reportDefinition && (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        Project Report
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            {project.myGroup
                                                                .reportSubmitted ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    <span className="text-sm text-green-600">
                                                                        Report
                                                                        submitted
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="h-4 w-4 text-orange-500" />
                                                                    <span className="text-sm text-orange-600">
                                                                        Draft in
                                                                        progress
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant={
                                                                project.myGroup
                                                                    .reportSubmitted
                                                                    ? 'outline'
                                                                    : 'default'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                handleOpenReport(
                                                                    project.id,
                                                                    project
                                                                        .myGroup!
                                                                        .id
                                                                )
                                                            }
                                                            className="w-full"
                                                        >
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            {project.myGroup
                                                                .reportSubmitted
                                                                ? 'View Report'
                                                                : 'Work on Report'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
