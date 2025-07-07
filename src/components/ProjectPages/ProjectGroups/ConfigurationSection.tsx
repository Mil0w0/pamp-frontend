import { cn } from '@/lib/utils'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReactNode } from 'react'

interface ConfigurationSectionProps {
    title: string
    description?: string
    status?:
        | 'success'
        | 'warning'
        | 'error'
        | 'info'
        | 'custom-purple'
        | 'bg-card'
    statusText?: string
    children: ReactNode
    className?: string
}

export function ConfigurationSection({
    title,
    description,
    status,
    statusText,
    children,
    className,
}: ConfigurationSectionProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950'
            case 'warning':
                return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
            case 'error':
                return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            case 'info':
                return 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
            case 'custom-purple':
                return 'border-[#6751E3]/20 bg-[#6751E3]/5 dark:border-[#6751E3]/40 dark:bg-[#6751E3]/10'
            case 'bg-card':
                return 'bg-card'
            default:
                return ''
        }
    }

    return (
        <Card
            className={cn(
                'transition-all duration-200',
                getStatusColor(),
                className
            )}
        >
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        {description && (
                            <CardDescription className="text-sm text-muted-foreground">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {status && statusText && (
                        <Badge className={'ml-2'}>{statusText}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    )
}
