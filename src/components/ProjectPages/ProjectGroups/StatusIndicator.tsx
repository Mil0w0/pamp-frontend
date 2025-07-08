import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Info,
    Users,
    XCircle,
} from 'lucide-react'

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'late'
type IconType =
    | 'check'
    | 'alert'
    | 'clock'
    | 'x'
    | 'info'
    | 'calendar'
    | 'users'
    | 'file'

interface StatusIndicatorProps {
    type: StatusType
    icon?: IconType
    text: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function StatusIndicator({
    type,
    icon,
    text,
    description,
    size = 'md',
    className,
}: StatusIndicatorProps) {
    const getIcon = () => {
        const iconClass = cn(
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5'
        )

        if (icon) {
            switch (icon) {
                case 'check':
                    return <CheckCircle className={iconClass} />
                case 'alert':
                    return <AlertCircle className={iconClass} />
                case 'clock':
                    return <Clock className={iconClass} />
                case 'x':
                    return <XCircle className={iconClass} />
                case 'info':
                    return <Info className={iconClass} />
                case 'calendar':
                    return <Calendar className={iconClass} />
                case 'users':
                    return <Users className={iconClass} />
                case 'file':
                    return <FileText className={iconClass} />
            }
        }

        // Default icons based on type
        switch (type) {
            case 'success':
                return <CheckCircle className={iconClass} />
            case 'warning':
                return <AlertCircle className={iconClass} />
            case 'error':
                return <XCircle className={iconClass} />
            case 'info':
                return <Info className={iconClass} />
            case 'pending':
                return <Clock className={iconClass} />
            case 'late':
                return <AlertCircle className={iconClass} />
        }
    }

    const getBadgeVariant = () => {
        switch (type) {
            case 'success':
                return 'default'
            case 'warning':
                return 'secondary'
            case 'error':
                return 'destructive'
            case 'info':
                return 'outline'
            case 'pending':
                return 'outline'
            case 'late':
                return 'destructive'
        }
    }

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-700 dark:text-green-300'
            case 'warning':
                return 'text-yellow-700 dark:text-yellow-300'
            case 'error':
                return 'text-red-700 dark:text-red-300'
            case 'info':
                return 'text-blue-700 dark:text-blue-300'
            case 'pending':
                return 'text-gray-700 dark:text-gray-300'
            case 'late':
                return 'text-red-700 dark:text-red-300'
        }
    }

    const sizeClass = cn(
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base'
    )

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Badge
                variant={getBadgeVariant()}
                className={cn('flex items-center gap-1', sizeClass)}
            >
                {getIcon()}
                {text}
            </Badge>
            {description && (
                <span className={cn('text-xs', getTextColor())}>
                    {description}
                </span>
            )}
        </div>
    )
}
