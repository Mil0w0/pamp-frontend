import { cn } from '@/lib/utils.ts'

interface LoadingSpinnerProps {
    className?: string
}

export default function LoadingSpinner({ className }: LoadingSpinnerProps) {
    return (
        <div className={cn('flex items-center justify-center h-64', className)}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
}
