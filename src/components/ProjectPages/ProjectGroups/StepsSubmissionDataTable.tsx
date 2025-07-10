import { ColumnDef } from '@tanstack/react-table'
import { DateTime } from 'luxon'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SubmissionResponse } from '@/services/SubmissionService/types'
import { Step } from '@/components/ProjectPages/types'
import {
    ExternalLink,
    Clock,
    CheckCircle,
    AlertTriangle,
    FileText,
    Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover.tsx'
import { ConformityRules } from '@/components/ProjectPages/ConformityRules/types.ts'

export type StepSubmissionRow = {
    stepName: string
    stepDescription?: string
    deadline?: string
    created_at?: string
    link?: string
    link_type?: string
    isLate?: boolean
    isSubmitted: boolean
    daysUntilDeadline?: number
    submissionGrade?: number
    submissionFeedback?: string
    rules: ConformityRules[]
}

export const columns: ColumnDef<StepSubmissionRow>[] = [
    {
        accessorKey: 'stepName',
        header: 'Step',
        cell: ({ row }) => {
            const stepName: string = row.getValue('stepName')
            const stepDescription: string | undefined =
                row.original.stepDescription

            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stepName}</span>
                    </div>
                    {stepDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {stepDescription}
                        </p>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: ({ row }) => {
            const deadline: string | undefined = row.getValue('deadline')
            const daysUntil = row.original.daysUntilDeadline

            if (!deadline) {
                return (
                    <span className="text-muted-foreground text-sm">
                        No deadline
                    </span>
                )
            }

            const deadlineDate = DateTime.fromISO(deadline)
            const isPast = deadlineDate < DateTime.now()
            const isUpcoming =
                daysUntil !== undefined && daysUntil <= 3 && daysUntil > 0

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="space-y-1">
                                    <div
                                        className={`text-sm ${isUpcoming ? 'text-yellow-600' : 'text-muted-foreground'}`}
                                    >
                                        {deadlineDate.toFormat('dd/MM/yyyy')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {deadlineDate.toFormat('HH:mm')}
                                    </div>
                                </div>
                                {isUpcoming && (
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-sm">
                                {isPast
                                    ? 'Deadline passed'
                                    : `${daysUntil} days remaining`}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Submitted',
        cell: ({ row }) => {
            const createdAt: string | undefined = row.getValue('created_at')
            const isSubmitted = row.original.isSubmitted

            if (!isSubmitted || !createdAt) {
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Not submitted
                        </span>
                    </div>
                )
            }

            const submissionDate = DateTime.fromISO(createdAt)

            return (
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {submissionDate.toFormat('dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {submissionDate.toFormat('HH:mm')}
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'link',
        header: 'Submission',
        cell: ({ row }) => {
            const url: string | undefined = row.getValue('link')
            const linkType: string | undefined = row.original.link_type
            const isSubmitted = row.original.isSubmitted

            if (!isSubmitted || !url) {
                return (
                    <Badge variant="outline" className="text-muted-foreground">
                        No submission
                    </Badge>
                )
            }

            return (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {linkType || 'Link'}
                    </Badge>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                        window.open(
                                            url,
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">Open submission</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        },
    },
    {
        accessorKey: 'isLate',
        header: 'Status',
        cell: ({ row }) => {
            const isLate = row.getValue('isLate')
            const isSubmitted = row.original.isSubmitted
            const daysUntil = row.original.daysUntilDeadline

            if (!isSubmitted) {
                if (daysUntil !== undefined) {
                    if (daysUntil < 0) {
                        return (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                            </Badge>
                        )
                    } else if (daysUntil <= 3) {
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
                                Pending
                            </Badge>
                        )
                    }
                }
                return (
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                )
            }

            if (isLate) {
                return (
                    <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Late
                    </Badge>
                )
            }

            return (
                <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    On time
                </Badge>
            )
        },
    },
    {
        accessorKey: 'submissionGrade',
        header: 'Grade',
        cell: ({ row }) => {
            const grade = row.original.submissionGrade
            const isSubmitted = row.original.isSubmitted

            if (!isSubmitted) {
                return <span className="text-muted-foreground text-sm">-</span>
            }

            if (grade === undefined || grade === null) {
                return (
                    <Badge variant="outline" className="text-xs">
                        Not graded
                    </Badge>
                )
            }

            const getGradeColor = (grade: number) => {
                if (grade >= 80) return 'text-green-600'
                if (grade >= 60) return 'text-yellow-600'
                return 'text-red-600'
            }

            return (
                <div className="flex items-center gap-1">
                    <span className={`font-medium ${getGradeColor(grade)}`}>
                        {grade}%
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: 'rules',
        header: 'Rules',
        cell: ({ row }) => {
            const rules: ConformityRules[] | undefined = row.getValue('rules')

            if (!rules || rules.length === 0) {
                return (
                    <span className="text-muted-foreground italic">None</span>
                )
            }

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            View ({rules.length})
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-auto space-y-3">
                        {rules.map((rule, index) => (
                            <div
                                key={index}
                                className="border rounded p-2 space-y-1 bg-muted/30"
                            >
                                <div className="text-sm font-semibold">
                                    {rule.name}
                                </div>
                                {Object.entries(rule.params).map(
                                    ([key, val]) => {
                                        const isPrimitive =
                                            typeof val === 'string' ||
                                            typeof val === 'number' ||
                                            typeof val === 'boolean'
                                        return isPrimitive ? (
                                            <div
                                                key={key}
                                                className="text-sm flex justify-between"
                                            >
                                                <span className="text-muted-foreground">
                                                    {key}
                                                </span>
                                                <span>{String(val)}</span>
                                            </div>
                                        ) : null
                                    }
                                )}
                            </div>
                        ))}
                    </PopoverContent>
                </Popover>
            )
        },
    },
]

export function StepsSubmissionDataTable({
    groupId,
    submissions,
    steps,
}: {
    groupId: string
    submissions: SubmissionResponse[] | null
    steps: Step[]
}) {
    // Filter steps that require submission
    const rows: StepSubmissionRow[] = steps
        .filter((step) => step.hasMandatorySubmission)
        .map((step) => {
            const submission = submissions?.find(
                (s) =>
                    s.project_step_uuid === step.id && s.group_uuid === groupId
            )

            const submittedAt = submission?.created_at
            const deadline = step.submissionDeadLine
            const isSubmitted = !!submission

            let isLate = false
            let daysUntilDeadline: number | undefined

            if (deadline) {
                const deadlineDate = DateTime.fromISO(deadline)
                const now = DateTime.now()
                daysUntilDeadline = Math.ceil(
                    deadlineDate.diff(now, 'days').days
                )

                if (submittedAt) {
                    const submissionDate = DateTime.fromISO(submittedAt)
                    isLate = submissionDate > deadlineDate
                }
            }

            return {
                stepName: step.name,
                stepDescription: step.description,
                deadline: step.submissionDeadLine,
                created_at: submittedAt,
                link: submission?.link,
                link_type: submission?.link_type,
                isLate,
                isSubmitted,
                daysUntilDeadline,
                // Note: Grade and feedback not available in current SubmissionResponse type
                submissionGrade: undefined,
                submissionFeedback: undefined,
                rules: step?.submissionConformityRules || [],
            }
        })

    // Calculate summary statistics
    const totalSteps = rows.length
    const submittedSteps = rows.filter((row) => row.isSubmitted).length
    const lateSubmissions = rows.filter((row) => row.isLate).length
    const overdueSteps = rows.filter(
        (row) => !row.isSubmitted && (row.daysUntilDeadline ?? 0) < 0
    ).length

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                        {submittedSteps}/{totalSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Submitted
                    </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                        {totalSteps - submittedSteps - overdueSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                        {lateSubmissions}
                    </div>
                    <div className="text-xs text-muted-foreground">Late</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                        {overdueSteps}
                    </div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg">
                <DataTable columns={columns} data={rows} />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>On time</span>
                </div>
                <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span>Late submission</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span>Due soon (≤3 days)</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Pending</span>
                </div>
            </div>
        </div>
    )
}
