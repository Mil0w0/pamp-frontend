import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Users } from 'lucide-react'
import { ProjectGroup } from '@/components/ProjectPages/types'

interface GroupCardProps {
    group: ProjectGroup
    studentCount: number
    minPerGroup: number
    maxPerGroup: number
    children?: React.ReactNode
    isDropTarget?: boolean
    className?: string
}

export function GroupCard({
    group,
    studentCount,
    minPerGroup,
    maxPerGroup,
    children,
    isDropTarget = false,
    className,
}: GroupCardProps) {
    const isUnderMin = studentCount < minPerGroup
    const isOverMax = studentCount > maxPerGroup
    const isFull = studentCount >= maxPerGroup
    const isEmpty = studentCount === 0

    const getStatusColor = () => {
        if (isOverMax) return 'text-destructive'
        if (isUnderMin) return 'text-warning'
        return 'text-success'
    }

    const getStatusIcon = () => {
        if (isOverMax || isUnderMin) return <AlertCircle className="h-4 w-4" />
        if (studentCount >= minPerGroup)
            return <CheckCircle className="h-4 w-4" />
        return <Users className="h-4 w-4" />
    }

    const getStatusBadge = () => {
        if (isOverMax) return <Badge variant="destructive">Over capacity</Badge>
        if (isFull) return <Badge variant="secondary">Full</Badge>
        if (isUnderMin && !isEmpty)
            return <Badge variant="outline">Needs more students</Badge>
        if (isEmpty) return <Badge variant="outline">Empty</Badge>
        return <Badge variant="default">Valid</Badge>
    }

    return (
        <Card
            className={cn(
                'transition-all duration-200 hover:shadow-md',
                isDropTarget && 'ring-2 ring-primary ring-offset-2 shadow-lg',
                isOverMax && 'border-destructive/50 bg-destructive/5',
                className
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        {getStatusIcon()}
                    </div>
                    {getStatusBadge()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className={getStatusColor()}>
                        {studentCount}/{maxPerGroup} students
                    </span>
                    <span className="text-xs">(min: {minPerGroup})</span>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="min-h-[120px] space-y-2">{children}</div>
            </CardContent>
        </Card>
    )
}
