import { useState, useEffect, useMemo } from 'react'
import { useStatus, useOthers } from '@liveblocks/react/suspense'
import { CheckCircle2 } from 'lucide-react'
import { SyncStatus } from '../types'

export function useTeacherReportSync() {
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
    const [isGrading, setIsGrading] = useState(false)
    const status = useStatus()
    const others = useOthers()

    // Update sync time when connection status changes to connected
    useEffect(() => {
        if (status === 'connected') {
            setLastSyncTime(new Date())
        }
    }, [status])

    // Update sync time display every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Force re-render to update the sync time display
            setLastSyncTime((prev) => prev)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    // Real-time sync time display
    const syncTimeDisplay = useMemo(() => {
        const now = new Date()
        const diffInSeconds = Math.floor(
            (now.getTime() - lastSyncTime.getTime()) / 1000
        )

        if (diffInSeconds < 30) {
            return 'Synced just now'
        } else if (diffInSeconds < 60) {
            return `Synced ${diffInSeconds}s ago`
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60)
            return `Synced ${minutes}m ago`
        } else {
            return lastSyncTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
        }
    }, [lastSyncTime])

    // Get sync status indicator
    const syncStatus: SyncStatus = useMemo(() => {
        switch (status) {
            case 'connected':
                return {
                    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                    text: syncTimeDisplay,
                }
            case 'connecting':
            case 'reconnecting':
                return {
                    icon: (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ),
                    text: 'Syncing...',
                }
            case 'disconnected':
                return {
                    icon: <div className="w-4 h-4 bg-red-500 rounded-full" />,
                    text: 'Disconnected',
                }
            default:
                return {
                    icon: <div className="w-4 h-4 bg-gray-400 rounded-full" />,
                    text: 'Initializing...',
                }
        }
    }, [status, syncTimeDisplay])

    // Handle grading submission
    const handleGradeSubmit = async () => {
        setIsGrading(true)
        try {
            // TODO: Replace with actual API call for grading
            await new Promise((resolve) => setTimeout(resolve, 2000))
            console.log('Grade submitted successfully')
        } catch (error) {
            console.error('Failed to submit grade:', error)
        } finally {
            setIsGrading(false)
        }
    }

    // Get active collaborators count
    const activeCollaborators = others.length + 1 // +1 for current user

    return {
        syncStatus,
        lastSyncTime,
        isGrading,
        activeCollaborators,
        handleGradeSubmit,
    }
}
