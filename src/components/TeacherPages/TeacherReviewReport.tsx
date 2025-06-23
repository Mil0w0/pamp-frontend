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
    FloatingComposer,
    FloatingThreads,
    useCreateBlockNoteWithLiveblocks,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MessageCircle, MessageSquare, User } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    ClientSideSuspense,
    useOthers,
    useStatus,
    useThreads,
} from '@liveblocks/react/suspense'
import { useParams } from 'react-router'
import { RoomProvider as CustomRoomProvider } from '@/lib/liveblocks'
import { createS3UploadForReports } from '@/utils/fileUpload.ts'
import {
    groupService,
    projectService,
    ReportDefinition,
    reportDefinitionService,
} from '@/services/ProjectService/project-api-client'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { Thread } from '@liveblocks/react-ui'
import '@liveblocks/react-ui/styles.css'

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
                        left: (start.left + end.left) / 2 - 60, // Center the toolbar
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

            tiptapEditor.view.dom.addEventListener(
                'mouseup',
                handleSelectionUpdate
            )
            tiptapEditor.view.dom.addEventListener(
                'keyup',
                handleSelectionUpdate
            )
            document.addEventListener('selectionchange', handleSelectionUpdate)

            return () => {
                tiptapEditor.view.dom.removeEventListener(
                    'mouseup',
                    handleSelectionUpdate
                )
                tiptapEditor.view.dom.removeEventListener(
                    'keyup',
                    handleSelectionUpdate
                )
                document.removeEventListener(
                    'selectionchange',
                    handleSelectionUpdate
                )
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
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <Button
                size="sm"
                onClick={handleAddComment}
                className="flex items-center gap-2 text-sm"
            >
                <MessageCircle className="w-4 h-4" />
                Add Comment
            </Button>
        </div>
    )
}

interface TeacherReviewReportContentProps {
    projectId: string
    groupId: string
}

interface TeacherQuestionReviewProps {
    question: { id: string; text: string }
    index: number
    isDarkMode: boolean
    uploadFile: any
}

function TeacherQuestionReview({
    question,
    index,
    isDarkMode,
    uploadFile,
}: TeacherQuestionReviewProps) {
    // Create a read-only collaborative editor for this specific question
    const editor = useCreateBlockNoteWithLiveblocks(
        {
            uploadFile,
        },
        {
            // Use question ID as the field to access the same document as students
            field: `question-${question.id}`,
        }
    )

    // Get threads for this specific question field
    const { threads: questionThreads } = useThreads({
        query: {
            resolved: false,
            metadata: {
                field: `question-${question.id}`,
            },
        },
    })

    if (!editor) {
        return (
            <div className="min-h-[20vh] border rounded-md flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading question...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between pt-[3px]">
                        <Label className="text-base font-medium leading-relaxed">
                            {question.text}
                        </Label>
                        {questionThreads.length > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {questionThreads.length} comment
                                {questionThreads.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="min-h-[20vh] border rounded-md relative">
                        <BlockNoteView
                            editor={editor}
                            theme={isDarkMode ? 'dark' : 'light'}
                            className="question-blocknote"
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
                            <CustomCommentToolbar editor={editor as any} />
                        </BlockNoteView>

                        {/* Comments Components for this question */}
                        {editor && (
                            <>
                                <FloatingThreads
                                    editor={editor as any}
                                    threads={questionThreads}
                                    className="floating-threads"
                                />
                                <FloatingComposer
                                    editor={editor as any}
                                    className="floating-composer"
                                    metadata={{
                                        field: `question-${question.id}`,
                                    }}
                                />
                            </>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div></div>
                        <span className="text-muted-foreground">
                            Select text to add comments
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Comment Threads Panel Component using official Liveblocks Thread component
function ThreadsPanel() {
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

function TeacherReviewReportContent({
    projectId,
    groupId,
}: TeacherReviewReportContentProps) {
    const { theme } = useTheme()
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
    const [isGrading, setIsGrading] = useState(false)
    const [project, setProject] = useState<Project | null>(null)
    const [group, setGroup] = useState<ProjectGroup | null>(null)
    const [reportDefinition, setReportDefinition] =
        useState<ReportDefinition | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const status = useStatus()
    const others = useOthers()

    // Fetch project and group data
    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !groupId) return

            setIsLoading(true)

            try {
                const [projectResponse, groupResponse, reportDefResponse] =
                    await Promise.all([
                        projectService.getOneById(projectId),
                        groupService.getOneById(groupId),
                        reportDefinitionService.getReportDefinition(projectId),
                    ])

                if (projectResponse.success && projectResponse.data) {
                    setProject(projectResponse.data as Project)
                }

                if (groupResponse.success && groupResponse.data) {
                    setGroup(groupResponse.data as ProjectGroup)
                }

                if (reportDefResponse.success && reportDefResponse.data) {
                    setReportDefinition(reportDefResponse.data)
                }
            } catch (error) {
                console.error('Error fetching project/group data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [projectId, groupId])

    // Use the default upload function (you can customize this for your backend)
    const uploadFile = createS3UploadForReports()

    // Create collaborative BlockNote editor for teacher review
    const editor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks(
        {
            uploadFile,
        },
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
                                <span>{group?.name || 'Loading...'}</span>
                            </div>
                            <span>•</span>
                            <span>{project?.name || 'Loading...'}</span>
                            {reportDefinition && (
                                <>
                                    <span>•</span>
                                    <span>
                                        Format:{' '}
                                        {reportDefinition.format ===
                                        'QUESTIONNAIRE'
                                            ? 'Questionnaire'
                                            : 'Classic Report'}
                                    </span>
                                </>
                            )}
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
                        <div className="space-y-4">
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
                                    {isLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            Loading report instructions...
                                        </div>
                                    ) : reportDefinition ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            {reportDefinition.instruction && (
                                                <div className="whitespace-pre-wrap text-sm mb-4">
                                                    {
                                                        reportDefinition.instruction
                                                    }
                                                </div>
                                            )}

                                            {reportDefinition.format ===
                                                'QUESTIONNAIRE' &&
                                                reportDefinition.questions && (
                                                    <div>
                                                        <h4 className="font-semibold mb-3">
                                                            Questions:
                                                        </h4>
                                                        <ol className="list-decimal list-inside space-y-2">
                                                            {reportDefinition.questions.map(
                                                                (
                                                                    question,
                                                                    index
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            question.id ||
                                                                            index
                                                                        }
                                                                        className="text-sm"
                                                                    >
                                                                        {
                                                                            question.text
                                                                        }
                                                                    </li>
                                                                )
                                                            )}
                                                        </ol>
                                                    </div>
                                                )}

                                            {!reportDefinition.instruction &&
                                                reportDefinition.format ===
                                                    'CLASSIC' && (
                                                    <div className="text-sm text-muted-foreground italic">
                                                        No specific instructions
                                                        provided.
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            No report definition found for this
                                            project.
                                        </div>
                                    )}
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

                            {/* Comment Threads Panel */}
                            <ThreadsPanel />
                        </div>
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
                                            You can review this report and
                                            create comment threads by selecting
                                            a part of the text
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
                                {isLoading ? (
                                    <div className="min-h-[75vh] border rounded-md flex items-center justify-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span>
                                                Loading student report...
                                            </span>
                                        </div>
                                    </div>
                                ) : reportDefinition?.format === 'CLASSIC' ? (
                                    // Classic format: Single BlockNote editor
                                    <div className="min-h-[75vh] border rounded-md relative">
                                        <BlockNoteView
                                            editor={editor}
                                            theme={
                                                isDarkMode ? 'dark' : 'light'
                                            }
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
                                            <CustomCommentToolbar
                                                editor={editor}
                                            />
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
                                ) : reportDefinition?.format ===
                                  'QUESTIONNAIRE' ? (
                                    // Questionnaire format: Show all questions with read-only editors
                                    <div className="space-y-8">
                                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                                📝 Questionnaire Report Review
                                            </h3>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                This is a questionnaire-format
                                                report. Each question has its
                                                own collaborative editor. You
                                                can add comments to any question
                                                by selecting text.
                                            </p>
                                        </div>

                                        {reportDefinition.questions?.map(
                                            (question, index) => (
                                                <TeacherQuestionReview
                                                    key={question.id}
                                                    question={question}
                                                    index={index}
                                                    isDarkMode={isDarkMode}
                                                    uploadFile={uploadFile}
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="min-h-[75vh] border rounded-md flex items-center justify-center">
                                        <div className="text-center space-y-4">
                                            <div className="text-6xl">📄</div>
                                            <p className="text-muted-foreground">
                                                No report format defined for
                                                this project.
                                            </p>
                                        </div>
                                    </div>
                                )}
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
    const { projectId, groupId } = useParams<{
        projectId: string
        groupId: string
    }>()

    if (!projectId || !groupId) {
        return <div>Error: Missing project or group information</div>
    }

    const roomId = `project-${projectId}-group-${groupId}-report`

    console.log('TeacherReviewReport room setup:', {
        projectId,
        groupId,
        roomId,
    })

    return (
        <CustomRoomProvider
            id={roomId}
            initialPresence={{}}
            initialStorage={{}}
        >
            <ClientSideSuspense fallback={<div>Loading report...</div>}>
                <TeacherReviewReportContent
                    projectId={projectId}
                    groupId={groupId}
                />
            </ClientSideSuspense>
        </CustomRoomProvider>
    )
}
