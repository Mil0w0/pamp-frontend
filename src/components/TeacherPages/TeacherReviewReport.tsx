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
import { Badge } from '@/components/ui/badge'
import SplitCollapsibleRightLayout from '@/components/layout/SplitCollapsibleRightLayout.tsx'
import { useTheme } from '@/components/ui/theme-provider'
import { BlockNoteEditor } from '@blocknote/core'
import {
    AnchoredThreads,
    FloatingComposer,
    FloatingThreads,
    useCreateBlockNoteWithLiveblocks,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MessageCircle, MessageSquare, User } from 'lucide-react'
import {
    ClientSideSuspense,
    LiveblocksProvider,
    RoomProvider,
    useOthers,
    useStatus,
    useThreads,
} from '@liveblocks/react/suspense'

// Mock data for demonstration
const mockProject = {
    name: 'E-commerce Web Application',
    student: {
        name: 'John Doe',
        email: 'john.doe@university.edu',
        id: 'student-123',
    },
    submittedAt: '2024-03-10T14:30:00Z',
    dueDate: '2024-03-15T23:59:00Z',
}

const mockInstructions = `Project Report Guidelines:

1. **Executive Summary** (10% of grade)
   - Brief overview of the project
   - Key achievements and outcomes

2. **Technical Implementation** (40% of grade)
   - Architecture decisions
   - Technologies used
   - Code quality and best practices

3. **Challenges and Solutions** (25% of grade)
   - Problems encountered
   - How they were resolved
   - Lessons learned

4. **Testing and Quality Assurance** (15% of grade)
   - Testing strategies
   - Bug fixes and improvements

5. **Reflection and Future Work** (10% of grade)
   - Personal learning outcomes
   - Potential improvements
   - Next steps

Your report should be well-structured, professional, and demonstrate critical thinking about your development process. Include specific examples and evidence to support your points.`

// Custom Comment Toolbar Component
function CustomCommentToolbar({ editor }: { editor: BlockNoteEditor | null }) {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    
    useEffect(() => {
        if (!editor) return

        const checkSelection = () => {
            try {
                const tiptapEditor = editor._tiptapEditor as any
                const selection = tiptapEditor.state.selection
                const hasTextSelection = !selection.empty
                
                if (hasTextSelection) {
                    // Get selection coordinates
                    const view = tiptapEditor.view
                    const { from, to } = selection
                    const start = view.coordsAtPos(from)
                    const end = view.coordsAtPos(to)
                    
                    // Position toolbar above selection
                    setPosition({
                        top: start.top - 50,
                        left: (start.left + end.left) / 2 - 60 // Center the toolbar
                    })
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            } catch (error) {
                console.error('Error checking selection:', error)
                setIsVisible(false)
            }
        }

        // Add event listeners for selection changes
        const tiptapEditor = editor._tiptapEditor as any
        if (tiptapEditor?.view) {
            const handleSelectionUpdate = () => {
                setTimeout(checkSelection, 10) // Small delay to ensure selection is updated
            }
            
            tiptapEditor.view.dom.addEventListener('mouseup', handleSelectionUpdate)
            tiptapEditor.view.dom.addEventListener('keyup', handleSelectionUpdate)
            document.addEventListener('selectionchange', handleSelectionUpdate)
            
            return () => {
                tiptapEditor.view.dom.removeEventListener('mouseup', handleSelectionUpdate)
                tiptapEditor.view.dom.removeEventListener('keyup', handleSelectionUpdate)
                document.removeEventListener('selectionchange', handleSelectionUpdate)
            }
        }
    }, [editor])

    const handleAddComment = () => {
        if (editor && editor._tiptapEditor) {
            try {
                const tiptapEditor = editor._tiptapEditor as any
                tiptapEditor.chain().focus().addPendingComment().run()
                setIsVisible(false) // Hide toolbar after adding comment
            } catch (error) {
                console.error('Failed to add comment:', error)
            }
        }
    }

    if (!isVisible || !editor) return null

    return (
        <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)'
            }}
        >
            <Button
                size="sm"
                variant="ghost"
                onClick={handleAddComment}
                className="flex items-center gap-2 text-sm"
            >
                <MessageCircle className="w-4 h-4" />
                Add Comment
            </Button>
        </div>
    )
}

function TeacherReviewReportContent() {
    const { theme } = useTheme()
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
    const [isGrading, setIsGrading] = useState(false)
    const status = useStatus()
    const others = useOthers()

    // Create collaborative BlockNote editor for teacher review
    const editor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks(
        {},
        {
            comments: true, // Ensure comments are enabled
        }
    )

    const { threads } = useThreads({ query: { resolved: false } })



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

    const handleGradeSubmit = async () => {
        setIsGrading(true)
        try {
            // TODO: Replace with actual API call for grading
            // const response = await submitGrade({
            //     studentId: mockProject.student.id,
            //     reportId: 'current-report-id',
            //     grade: selectedGrade,
            //     feedback: comments
            // })

            // Simulate API call for now
            await new Promise((resolve) => setTimeout(resolve, 2000))

            console.log('Grade submitted successfully')
            // TODO: Handle success response
        } catch (error) {
            console.error('Failed to submit grade:', error)
            // TODO: Handle error (show toast, etc.)
        } finally {
            setIsGrading(false)
        }
    }

    // Get active collaborators count
    const activeCollaborators = others.length + 1 // +1 for current user



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
                                <BreadcrumbLink href="/teacher">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/teacher/reports">
                                    Reports
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Review Report</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Student Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Review Student Report
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{mockProject.student.name}</span>
                            </div>
                            <span>•</span>
                            <span>{mockProject.name}</span>
                            <span>•</span>
                            <span>
                                Submitted:{' '}
                                {new Date(
                                    mockProject.submittedAt
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white">
                            Submitted
                        </Badge>
                        {activeCollaborators > 1 && (
                            <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                <User className="w-3 h-3" />
                                {activeCollaborators} viewing
                            </Badge>
                        )}
                    </div>
                </div>

                <SplitCollapsibleRightLayout
                    sidebarTitle="Grading Rubric"
                    sidebarContent={
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Grading Rubric
                                </CardTitle>
                                <CardDescription>
                                    Assessment criteria for this report
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-sm">
                                        {mockInstructions}
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t">
                                    <Button
                                        onClick={handleGradeSubmit}
                                        disabled={isGrading}
                                        className="w-full flex items-center gap-2"
                                    >
                                        {isGrading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Submitting Grade...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Submit Grade & Feedback
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    }
                >
                    {/* Report Viewer Card */}
                    <div className="flex justify-center">
                        <Card className="w-full max-w-[1500px]">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg">
                                                Student Report
                                            </CardTitle>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                <MessageSquare className="w-3 h-3 mr-1" />
                                                {threads.length} Comments
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Read-only view with commenting
                                            enabled
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Instructions */}
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Select text to add comments
                                        </span>

                                        {/* Sync Status Indicator */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
                                            {syncStatus.icon}
                                            <span>{syncStatus.text}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="min-h-[75vh] border rounded-md relative">
                                    <BlockNoteView
                                        editor={editor}
                                        theme={isDarkMode ? 'dark' : 'light'}
                                        className="full-height-blocknote"
                                        editable={false}
                                        formattingToolbar={false}
                                        linkToolbar={false}
                                        sideMenu={false}
                                        slashMenu={false}
                                        emojiPicker={false}
                                        filePanel={false}
                                        tableHandles={false}
                                    >
                                        {/* Custom Formatting Toolbar for Comments Only */}
                                        <CustomCommentToolbar editor={editor} />
                                    </BlockNoteView>

                                    {/* Comments Components */}
                                    {editor && (
                                        <>
                                            {/* Use FloatingThreads for closeable comment display */}
                                            <FloatingThreads
                                                editor={editor}
                                                threads={threads}
                                                className="floating-threads"
                                            />
                                            {/* FloatingComposer for creating new comments */}
                                            <FloatingComposer
                                                editor={editor}
                                                className="floating-composer"
                                            />
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    <p>
                                        💡 <strong>Teacher Mode:</strong> This
                                        report is read-only. To add comments:{' '}
                                        <strong>1)</strong> Select text in the
                                        document, then <strong>2)</strong> click
                                        the "Add Comment" button that appears.{' '}
                                        <strong>
                                            Real-time collaboration with other
                                            reviewers enabled!
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

export default function TeacherReviewReport() {
    return (
        <LiveblocksProvider
            publicApiKey={
                'pk_dev_ECOQqvJfrls4sg1uTAOZrnEdvZDVZqFSCaI4NDRIi8KtVze5aNvoarM1tSHjrjJl'
            }
        >
            <RoomProvider id="student-report-classic">
                <ClientSideSuspense fallback={<div>Loading report...</div>}>
                    <TeacherReviewReportContent />
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}
