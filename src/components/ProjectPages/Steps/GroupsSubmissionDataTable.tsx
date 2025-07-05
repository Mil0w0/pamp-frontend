import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { SubmissionResponse } from '@/services/SubmissionService/types.ts'
import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { DataTable } from '@/components/ui/data-table.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'

export type SubmissionRow = {
    id?: string
    created_at?: string
    link?: string
    link_type?: string
    group_name: string
    isLate?: boolean
    hasSubmitted?: boolean
}

export const columns: ColumnDef<SubmissionRow>[] = [
    {
        accessorKey: 'hasSubmitted',
        header: 'Submitted?',
        cell: ({ row }) => {
            const submitted = row.getValue('hasSubmitted')
            return (
                <Badge variant={submitted ? 'default' : 'secondary'}>
                    {submitted ? 'Yes' : 'No'}
                </Badge>
            )
        },
        enableSorting: true,
    },
    {
        accessorKey: 'group_name',
        header: 'Group',
        cell: ({ row }) => <div>{row.getValue('group_name')}</div>,
    },
    {
        accessorKey: 'created_at',
        header: 'Submitted At',
        cell: ({ row }) => {
            return (
                <div className="text-sm text-muted-foreground">
                    {DateTime.fromISO(row.getValue('created_at')).toFormat(
                        'dd/MM/yyyy HH:mm'
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: 'link',
        header: 'Link',
        cell: ({ row }) => {
            const url: string = row.getValue('link')
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sidebar-primary-foreground underline"
                >
                    Open
                </a>
            )
        },
    },
    {
        accessorKey: 'link_type',
        header: 'Link Type',
    },
    {
        accessorKey: 'isLate',
        header: 'Status',
        cell: ({ row }) => {
            const isLate = row.getValue('isLate')
            return (
                <Badge variant={isLate ? 'destructive' : 'default'}>
                    {isLate ? 'Late' : 'OK'}
                </Badge>
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
        if (!stepDeadline) return
        if (!submissions) return
        if (!groups) return
        const deadline = DateTime.fromISO(stepDeadline)

        const mapped = groups.map((group) => {
            const submission = submissions.find(
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
                isLate: created > deadline,
                hasSubmitted: true,
            }
        })
        setData(mapped)
    }, [submissions, groups, stepDeadline])

    return (
        <div className="container mx-auto py-6">
            <h2 className="text-xl font-semibold mb-4">
                Group Submissions for this step
            </h2>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
