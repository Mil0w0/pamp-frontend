import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SubmissionResponse } from '@/services/SubmissionService/types.ts'
import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { DataTable } from '@/components/ui/data-table.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { handleSubmissionDownload } from '@/utils/fileUpload.ts'
import { SimilarityCell } from './SimilarityCell'
import {
    Calendar,
    CheckIcon,
    ClockIcon,
    DownloadIcon,
    ExternalLink,
    Eye,
    FileIcon,
    GithubIcon,
    XIcon,
} from 'lucide-react'

export type SubmissionRow = {
    id?: string
    created_at?: string
    link?: string
    link_type?: string
    group_name: string
    isLate?: boolean
    hasSubmitted: boolean
}

export const columns: ColumnDef<SubmissionRow>[] = [
    {
        accessorKey: 'hasSubmitted',
        header: () => (
            <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4" />
                Status
            </div>
        ),
        cell: ({ row }) => {
            const submitted = row.getValue('hasSubmitted')
            const isLate = row.original.isLate

            if (!submitted) {
                return (
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1 w-fit"
                    >
                        <XIcon className="h-3 w-3" />
                        Not Submitted
                    </Badge>
                )
            }

            return (
                <Badge
                    variant={isLate ? 'destructive' : 'default'}
                    className="flex items-center gap-1 w-fit"
                >
                    {isLate ? (
                        <>
                            <ClockIcon className="h-3 w-3" />
                            Late
                        </>
                    ) : (
                        <>
                            <CheckIcon className="h-3 w-3" />
                            On Time
                        </>
                    )}
                </Badge>
            )
        },
        enableSorting: true,
    },
    {
        accessorKey: 'group_name',
        header: 'Group Name',
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue('group_name')}</div>
        ),
    },
    {
        accessorKey: 'link_type',
        header: 'Type',
        cell: ({ row }) => {
            const type: string | undefined = row.getValue('link_type')
            if (!type) {
                return <span className="text-muted-foreground italic">N/A</span>
            }

            return (
                <div className="flex items-center gap-2">
                    {type === 'github' ? (
                        <GithubIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge variant="secondary" className="text-xs">
                        {type === 'github'
                            ? 'GitHub'
                            : type === 's3'
                              ? 'File'
                              : type}
                    </Badge>
                </div>
            )
        },
    },
    {
        accessorKey: 'created_at',
        header: () => (
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Submitted At
            </div>
        ),
        cell: ({ row }) => {
            const createdAt: string | undefined = row.getValue('created_at')
            if (!createdAt) {
                return <div className="text-muted-foreground italic">N/A</div>
            }
            DateTime.fromISO(createdAt).toFormat('dd/MM/yyyy HH:mm')
            return (
                <div className="text-sm">
                    <div className="font-medium">
                        {DateTime.fromISO(createdAt).toFormat('dd/MM/yyyy')}
                    </div>
                    <div className="text-muted-foreground">
                        {DateTime.fromISO(createdAt).toFormat('HH:mm')}
                    </div>
                </div>
            )
        },
        enableSorting: true,
    },
    {
        accessorKey: 'similarity',
        header: () => (
            <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Similarity
            </div>
        ),
        cell: ({ row }) => <SimilarityCell submissionId={row.original.id} />,
        enableSorting: false,
    },
    {
        accessorKey: 'link',
        header: 'Actions',
        cell: ({ row }) => {
            const url: string | undefined = row.getValue('link')
            const linkType: string | undefined = row.getValue('link_type')

            if (!url || !linkType) {
                return <span className="text-muted-foreground italic">N/A</span>
            }

            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSubmissionDownload(url, linkType)}
                >
                    {linkType === 'github' ? (
                        <ExternalLink className="h-4 w-4" />
                    ) : (
                        <DownloadIcon className="h-4 w-4" />
                    )}
                </Button>
            )
        },
    },
]

export default function GroupsSubmissionDataTable({
    submissions,
    groups,
    stepDeadline,
}: {
    submissions: SubmissionResponse[] | null
    groups: ProjectGroup[] | undefined
    stepDeadline: string | undefined
}) {
    const [data, setData] = useState<SubmissionRow[]>([])

    useEffect(() => {
        if (!groups) return

        const deadline = stepDeadline ? DateTime.fromISO(stepDeadline) : null

        const mapped: SubmissionRow[] = groups.map((group) => {
            const submission = submissions?.find(
                (s) => s.group_uuid === group.id
            )

            if (!submission) {
                return {
                    group_name: group.name,
                    hasSubmitted: false,
                }
            }

            const created = DateTime.fromISO(submission.created_at)

            return {
                id: submission.id,
                created_at: submission.created_at,
                link: submission.link,
                link_type: submission.link_type,
                group_name: group.name,
                isLate: deadline ? created > deadline : false,
                hasSubmitted: true,
            }
        })

        setData(mapped)
    }, [submissions, groups, stepDeadline])

    // Calculate statistics
    const totalGroups = groups?.length || 0
    const submittedCount = data.filter((row) => row.hasSubmitted).length
    const lateCount = data.filter(
        (row) => row.hasSubmitted && row.isLate
    ).length
    const onTimeCount = submittedCount - lateCount

    return (
        <div className="space-y-6">
            {/* Header with statistics */}
            <div className="bg-white dark:bg-muted rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Group Submissions Overview
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Monitor submission status across all project groups
                        </p>
                    </div>
                    {stepDeadline && (
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                                Deadline
                            </p>
                            <p className="font-medium">
                                {DateTime.fromISO(stepDeadline).toFormat(
                                    'dd/MM/yyyy HH:mm'
                                )}
                            </p>
                        </div>
                    )}
                </div>

                {/* Statistics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                            >
                                {totalGroups}
                            </Badge>
                            <span className="text-sm font-medium">
                                Total Groups
                            </span>
                        </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="default"
                                className="h-6 w-6 rounded-full p-0 flex items-center justify-center bg-green-600"
                            >
                                {onTimeCount}
                            </Badge>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                On Time
                            </span>
                        </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="destructive"
                                className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                            >
                                {lateCount}
                            </Badge>
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                Late
                            </span>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                            >
                                {totalGroups - submittedCount}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Not Submitted
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data table */}
            <div className="bg-white dark:bg-muted rounded-lg border">
                <DataTable columns={columns} data={data} />
            </div>
        </div>
    )
}
