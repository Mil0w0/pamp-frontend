import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertCircle,
    Wifi,
    Shield,
    Server,
    AlertTriangle,
    RefreshCw,
    X,
} from 'lucide-react'
import { ErrorInfo, getErrorActions } from '@/utils/errorHandling'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
    error: ErrorInfo
    onRetry?: () => void
    onDismiss?: () => void
    className?: string
    compact?: boolean
}

const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
        case 'network':
            return Wifi
        case 'permission':
            return Shield
        case 'server':
            return Server
        case 'validation':
            return AlertTriangle
        default:
            return AlertCircle
    }
}

const getErrorVariant = (
    type: ErrorInfo['type']
): 'default' | 'destructive' => {
    switch (type) {
        case 'validation':
        case 'permission':
            return 'destructive'
        default:
            return 'default'
    }
}

const getTypeLabel = (type: ErrorInfo['type']): string => {
    switch (type) {
        case 'network':
            return 'Réseau'
        case 'permission':
            return 'Permission'
        case 'server':
            return 'Serveur'
        case 'validation':
            return 'Validation'
        default:
            return 'Erreur'
    }
}

const getTypeBadgeVariant = (
    type: ErrorInfo['type']
): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
        case 'network':
            return 'outline'
        case 'permission':
            return 'destructive'
        case 'server':
            return 'secondary'
        case 'validation':
            return 'destructive'
        default:
            return 'default'
    }
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    onRetry,
    onDismiss,
    className,
    compact = false,
}) => {
    const Icon = getErrorIcon(error.type)
    const actions = getErrorActions(error)
    const variant = getErrorVariant(error.type)

    if (compact) {
        return (
            <Alert variant={variant} className={cn('border-l-4', className)}>
                <Icon className="h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                    <AlertDescription className="flex-1">
                        {error.message}
                    </AlertDescription>
                    <div className="flex items-center gap-2 ml-4">
                        {error.retryable && onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="h-8"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Réessayer
                            </Button>
                        )}
                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDismiss}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </Alert>
        )
    }

    return (
        <Alert variant={variant} className={cn('border-l-4', className)}>
            <Icon className="h-4 w-4" />
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <AlertTitle className="flex items-center gap-2">
                        {error.title}
                        <Badge
                            variant={getTypeBadgeVariant(error.type)}
                            className="text-xs"
                        >
                            {getTypeLabel(error.type)}
                        </Badge>
                    </AlertTitle>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDismiss}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <AlertDescription className="mb-3">
                    {error.message}
                </AlertDescription>

                {(error.actionable || error.retryable) && (
                    <div className="flex flex-wrap gap-2">
                        {error.retryable && onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="h-8"
                            >
                                <RefreshCw className="h-3 w-3 mr-2" />
                                Réessayer
                            </Button>
                        )}

                        {error.actionable && actions.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium">
                                    Actions suggérées :
                                </span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    {actions.slice(1).map((action, index) => (
                                        <li key={index}>{action}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Alert>
    )
}

// Composant simplifié pour les erreurs inline
export const InlineError: React.FC<{
    message: string
    onRetry?: () => void
}> = ({ message, onRetry }) => {
    return (
        <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
            {onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-6 px-2 text-xs"
                >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Réessayer
                </Button>
            )}
        </div>
    )
}
