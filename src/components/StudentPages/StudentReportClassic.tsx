import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import SplitCollapsibleRightLayout from '@/components/layout/SplitCollapsibleRightLayout.tsx'
import { useTheme } from '@/components/ui/theme-provider'
import { BlockNoteEditor } from '@blocknote/core'
import { useCreateBlockNoteWithLiveblocks } from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, SendIcon } from 'lucide-react'
import {
    ClientSideSuspense,
    LiveblocksProvider,
    RoomProvider,
    useStatus,
} from '@liveblocks/react/suspense'
import { Badge } from '@/components/ui/badge'

// Mock data for demonstration
const mockProject = {
    id: '1',
    name: 'Web Development Final Project',
    description: 'Create a full-stack web application using React and Node.js',
}

const mockInstructions = `Please provide a comprehensive report covering the following aspects of your project:

1. **Project Overview**: Describe your project's purpose, target audience, and main features.

2. **Technical Implementation**: Detail the technologies used, architecture decisions, and key challenges faced.

3. **Learning Outcomes**: Reflect on what you learned during this project and how it relates to course concepts.

4. **Code Quality**: Discuss your approach to code organization, testing, and best practices.

5. **Future Improvements**: Identify areas for enhancement and potential next steps.

Your report should be well-structured, professional, and demonstrate critical thinking about your development process. Include specific examples and evidence to support your points.`

function StudentReportClassicContent() {
    const { theme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [reportStatus, setReportStatus] = useState<'draft' | 'submitted'>(
        'draft'
    )
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
    const status = useStatus()

    // Create collaborative BlockNote editor with theme support
    const editor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks()

    // Update sync time when connection status changes to connected
    useEffect(() => {
        if (status === 'connected') {
            setLastSyncTime(new Date())
        }
    }, [status])

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

    // Update sync time display every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Force re-render to update the sync time display
            setLastSyncTime((prev) => prev)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    // Get sync status indicator
    const getSyncStatus = () => {
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
    }

    const syncStatus = getSyncStatus()

    // Determine if we should use dark theme for BlockNote
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
    }, [theme])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const content = editor.document
            console.log('Saving report content:', content)
            // TODO: Implement save functionality
            await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
        } catch (error) {
            console.error('Error saving report:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // TODO: Replace with actual API call
            // const response = await submitReport({
            //     content: editor.document,
            //     reportId: 'current-report-id'
            // })

            // Simulate API call for now
            await new Promise((resolve) => setTimeout(resolve, 2000))

            setReportStatus('submitted')
            console.log('Report submitted successfully')
            // TODO: Handle success response
        } catch (error) {
            console.error('Failed to submit report:', error)
            // TODO: Handle error (show toast, etc.)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header with Breadcrumb */}
            <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
                <div className="flex items-center gap-2 px-4">
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/projects">
                                    My Projects
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    {mockProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Project Report</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Project Info */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Project Report
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {mockProject.name}
                    </p>
                </div>

                <SplitCollapsibleRightLayout
                    sidebarTitle="Instructions"
                    sidebarContent={
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Instructions
                                </CardTitle>
                                <CardDescription>
                                    Follow these guidelines when writing your
                                    report
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-sm">
                                        {mockInstructions}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    }
                >
                    {/* Editor Card */}
                    <div className="flex justify-center">
                        <Card className="w-full max-w-[1500px]">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg">
                                                Your Report
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    reportStatus === 'submitted'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    reportStatus === 'submitted'
                                                        ? 'bg-green-600 text-white '
                                                        : 'bg-orange-500 text-white'
                                                }
                                            >
                                                {reportStatus === 'draft'
                                                    ? 'Draft'
                                                    : 'Submitted'}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Write your project report using the
                                            collaborative rich text editor below
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Sync Status Indicator */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
                                            {syncStatus.icon}
                                            <span>{syncStatus.text}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSubmit}
                                                disabled={
                                                    isSubmitting ||
                                                    reportStatus === 'submitted'
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : reportStatus ===
                                                  'submitted' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Submitted
                                                    </>
                                                ) : (
                                                    <>
                                                        <SendIcon className="w-4 h-4" />
                                                        Submit Report
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="min-h-[75vh] border rounded-md">
                                    <BlockNoteView
                                        editor={editor}
                                        theme={isDarkMode ? 'dark' : 'light'}
                                        className="full-height-blocknote"
                                    />
                                </div>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    <p>
                                        💡 <strong>Tip:</strong> Your work is
                                        automatically saved as you type. Use the
                                        toolbar to format your text, add
                                        headings, lists, and more.{' '}
                                        <strong>
                                            Real-time collaboration enabled!
                                        </strong>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </SplitCollapsibleRightLayout>
            </div>
        </div>
    )
}

export default function StudentReportClassic() {
    const apiKey =
        window.RUNTIME_CONFIG?.AUTH_API_URL ||
        import.meta.env.VITE_LIVEBLOCKS_KEY

    if (!apiKey) {
        throw new Error(
            'Please set your Liveblocks public API key in the environment variables.'
        )
    }

    return (
        <LiveblocksProvider publicApiKey={apiKey}>
            <RoomProvider id="student-report-classic">
                <ClientSideSuspense
                    fallback={<div>Loading collaborative editor...</div>}
                >
                    <StudentReportClassicContent />
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}
