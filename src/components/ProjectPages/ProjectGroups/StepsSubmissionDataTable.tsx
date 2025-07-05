import { ColumnDef } from '@tanstack/react-table'
import { DateTime } from 'luxon'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { SubmissionResponse } from '@/services/SubmissionService/types'
import { Step } from '@/components/ProjectPages/types'

export type StepSubmissionRow = {
    stepName: string
    created_at?: string
    link?: string
    link_type?: string
    isLate?: boolean
}

export const columns: ColumnDef<StepSubmissionRow>[] = [
    {
        accessorKey: 'stepName',
        header: 'Step',
    },
    {
        accessorKey: 'created_at',
        header: 'Submitted At',
        cell: ({ row }) => {
            const createdAt: string = row.getValue('created_at')
            return createdAt ? (
                <div className="text-sm text-muted-foreground">
                    {DateTime.fromISO(createdAt).toFormat('dd/MM/yyyy HH:mm')}
                </div>
            ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
            )
        },
    },
    {
        accessorKey: 'link',
        header: 'Link',
        cell: ({ row }) => {
            const url: string | undefined = row.getValue('link')
            return url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    Open
                </a>
            ) : (
                <span className="text-muted-foreground text-sm">N/A</span>
            )
        },
    },
    {
        accessorKey: 'link_type',
        header: 'Link Type',
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.getValue('link_type') || 'N/A'}
            </span>
        ),
    },
    {
        accessorKey: 'isLate',
        header: 'Status',
        cell: ({ row }) => {
            const isLate = row.getValue('isLate')
            const createdAt = row.getValue('created_at')
            return createdAt ? (
                <Badge variant={isLate ? 'destructive' : 'default'}>
                    {isLate ? 'Late' : 'OK'}
                </Badge>
            ) : (
                <Badge variant="secondary">Not submitted</Badge>
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
    const requiredSteps = steps.filter((step) => step.hasMandatorySubmission)

    const rows: StepSubmissionRow[] = requiredSteps.map((step) => {
        const sub = submissions?.find(
            (s) => s.project_step_uuid === step.id && s.group_uuid === groupId
        )
        const created = sub?.created_at
        return {
            stepName: step.name,
            created_at: created,
            link: sub?.link,
            link_type: sub?.link_type,
            isLate: created
                ? DateTime.fromISO(created) >
                  DateTime.fromISO(step.submissionDeadLine)
                : undefined,
        }
    })

    return (
        <div className="py-4">
            <DataTable columns={columns} data={rows} />
        </div>
    )
}
