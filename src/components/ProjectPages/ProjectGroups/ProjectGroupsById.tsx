import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect, useState } from 'react'
import { fetchGroupById, fetchProjectById } from '@/store/project.slice.ts'
import { Link, useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
    AlertCircle,
    Calendar,
    FileText,
    SquareArrowOutUpRight,
    Users,
} from 'lucide-react'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import { StepsSubmissionDataTable } from '@/components/ProjectPages/ProjectGroups/StepsSubmissionDataTable.tsx'
import { sumbissionService } from '@/services/SubmissionService/submission-api-client.ts'
import { SubmissionResponse } from '@/services/SubmissionService/types.ts'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StudentCard } from './StudentCard'
import { StatusIndicator } from './StatusIndicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DateTime } from 'luxon'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProjectGroupsById() {
    const { projectId, groupId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject, currentGroup } = useSelector(
        (state: RootState) => state.project
    )
    const [allStudents, setAllStudents] = useState<Student[]>([])
    const [groupsStudents, setGroupsStudents] = useState<Student[]>([])
    const [submissions, setSubmissions] = useState<SubmissionResponse[] | null>(
        null
    )
    const [isLoading, setIsLoading] = useState(true)

    const getStudentsForGroup = (
        group: ProjectGroup,
        allStudents: Student[]
    ) => {
        const ids = (group.studentsIds ?? '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        setGroupsStudents(
            allStudents.filter((student) => ids.includes(student.user_id))
        )
    }

    const getAllStudents = async () => {
        try {
            const response = await authService.getStudents()
            if (response.success) {
                return response.data as Student[]
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong.')
            console.error(error)
        }
    }

    const loadAllGroupsSubmissions = async () => {
        if (!groupId || !projectId) return
        try {
            const response = await sumbissionService.getAllByGroup(
                groupId,
                projectId
            )
            if (response.success && response.data) {
                setSubmissions(response.data)
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error while fetching submissions')
            console.error(error)
        }
    }

    const getGroupStats = () => {
        if (!currentGroup || !currentProject) return null

        const studentCount = groupsStudents.length
        const minRequired = currentProject.minPerGroup
        const maxAllowed = currentProject.maxPerGroup

        const isValid =
            studentCount >= minRequired && studentCount <= maxAllowed
        const submissionCount = submissions?.length || 0
        const totalSteps =
            currentProject.steps?.filter((step) => step.hasMandatorySubmission)
                ?.length || 0

        return {
            studentCount,
            minRequired,
            maxAllowed,
            isValid,
            submissionCount,
            totalSteps,
            isComplete: submissionCount === totalSteps,
        }
    }

    useEffect(() => {
        getAllStudents()
            .then((students) => {
                if (students) {
                    setAllStudents(students)
                }
            })
            .catch((error) => console.log(error))
    }, [])

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (groupId) {
            dispatch(fetchGroupById(groupId))
        }
    }, [dispatch, projectId, groupId])

    useEffect(() => {
        if (currentGroup && allStudents.length > 0) {
            getStudentsForGroup(currentGroup, allStudents)
            loadAllGroupsSubmissions().finally(() => setIsLoading(false))
        }
    }, [currentGroup, allStudents])

    if (!currentProject || !currentGroup) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    const stats = getGroupStats()

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
                                    href={`/projects/${currentProject.id}/settings`}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href={`/projects/${currentProject.id}/groups/${currentGroup.id}`}
                                    className="flex items-center gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    {currentGroup.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="container mx-auto p-6 space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {currentGroup.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Group details and submission tracking
                        </p>
                    </div>
                    {stats && (
                        <div className="flex items-center gap-2">
                            <StatusIndicator
                                type={stats.isValid ? 'success' : 'warning'}
                                icon={stats.isValid ? 'check' : 'alert'}
                                text={
                                    stats.isValid
                                        ? 'Valid group'
                                        : 'Needs attention'
                                }
                                description={`${stats.studentCount}/${stats.maxAllowed} students`}
                            />
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Group Overview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Group Members */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Group Members
                                    <Badge variant="secondary">
                                        {groupsStudents.length}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {stats
                                        ? `Required: ${stats.minRequired}-${stats.maxAllowed} students`
                                        : 'Loading...'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton
                                                key={i}
                                                className="h-16 w-full"
                                            />
                                        ))}
                                    </div>
                                ) : groupsStudents.length > 0 ? (
                                    <div className="space-y-3">
                                        {groupsStudents.map((student) => (
                                            <StudentCard
                                                key={student.user_id}
                                                student={student}
                                                canDrag={false}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">
                                            No students assigned to this group
                                            yet
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submissions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Step Submissions
                                    {stats && (
                                        <Badge
                                            variant={
                                                stats.isComplete
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {stats.submissionCount}/
                                            {stats.totalSteps}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Track submission progress for each project
                                    step
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-64 w-full" />
                                ) : (
                                    <StepsSubmissionDataTable
                                        groupId={currentGroup.id}
                                        steps={currentProject.steps}
                                        submissions={submissions}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Group Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Group Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stats && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Size
                                            </span>
                                            <StatusIndicator
                                                type={
                                                    stats.isValid
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                                text={`${stats.studentCount} students`}
                                                size="sm"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Submissions
                                            </span>
                                            <StatusIndicator
                                                type={
                                                    stats.isComplete
                                                        ? 'success'
                                                        : 'pending'
                                                }
                                                text={`${stats.submissionCount}/${stats.totalSteps}`}
                                                size="sm"
                                            />
                                        </div>
                                    </>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <span className="text-sm font-medium">
                                        Quick Actions
                                    </span>
                                    <div className="grid gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Manage Members
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            View All Submissions
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Project Report */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Project Report
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentGroup.reportSubmitted ? (
                                    <div className="space-y-3">
                                        <StatusIndicator
                                            type="success"
                                            icon="check"
                                            text="Report submitted"
                                            description={
                                                currentGroup.reportSubmittedDate
                                                    ? `Submitted on ${DateTime.fromISO(currentGroup.reportSubmittedDate).toFormat('dd/MM/yyyy HH:mm')}`
                                                    : undefined
                                            }
                                        />

                                        <Button asChild className="w-full">
                                            <Link
                                                to={{
                                                    pathname: '/',
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                View Report
                                                <SquareArrowOutUpRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <StatusIndicator
                                            type="pending"
                                            icon="clock"
                                            text="Report not submitted"
                                            description="Group hasn't submitted their final report yet"
                                        />

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <Link
                                                to={{
                                                    pathname: '/',
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                Access Editor
                                                <SquareArrowOutUpRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Group Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {groupsStudents.length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Members
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-green-600">
                                            {submissions?.length || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Submissions
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    {/* Member avatars */}
                                    <div className="flex -space-x-2">
                                        {groupsStudents
                                            .slice(0, 4)
                                            .map((student, index) => (
                                                <Avatar
                                                    key={student.user_id}
                                                    className="border-2 border-background h-8 w-8"
                                                >
                                                    <AvatarFallback className="text-xs">
                                                        {student.first_name[0]}
                                                        {student.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        {groupsStudents.length > 4 && (
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
                                                +{groupsStudents.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
