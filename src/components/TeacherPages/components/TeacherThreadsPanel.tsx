import { useThreads } from '@liveblocks/react/suspense'
import { MessageSquare } from 'lucide-react'
import { Thread } from '@liveblocks/react-ui'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export function TeacherThreadsPanel() {
    const { threads } = useThreads({ query: { resolved: false } })

    if (threads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Comment Threads
                    </CardTitle>
                    <CardDescription>
                        All active comment threads
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No active comment threads yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Select text to add comments
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comment Threads
                </CardTitle>
                <CardDescription>
                    {threads.length} active thread
                    {threads.length !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {threads.map((thread) => (
                        <div key={thread.id} className="border rounded-lg p-2">
                            <Thread thread={thread} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
