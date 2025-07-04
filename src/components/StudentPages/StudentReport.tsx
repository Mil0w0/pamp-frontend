import { useCallback, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
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
import { CheckCircle2, MessageSquare, SendIcon } from 'lucide-react'
import { ClientSideSuspense, useThreads } from '@liveblocks/react/suspense'
import { RoomProvider as CustomRoomProvider } from '@/lib/liveblocks'
import '@liveblocks/react-ui/styles.css'

// UI Components
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

// Utils and Services
import { createS3UploadForReports } from '@/utils/fileUpload.ts'

// Custom Hooks and Components
import { useReportData, useReportSync } from './hooks'
import {
    MemoizedCollaborativeQuestionEditor,
    ReportInstructionsCard,
    ReportProgressCard,
    ThreadsPanel,
} from './components'
import { QuestionProgress, StudentReportContentProps } from './types'
import { groupService } from '@/services/ProjectService/project-api-client'

function ReportLoadingState() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading project information...</span>
            </div>
        </div>
    )
}

function ReportAccessDeniedState({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-red-600">
                        Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center space-y-4">
                        <div className="text-6xl">🚫</div>
                        <p className="text-muted-foreground">{message}</p>
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="w-full"
                        >
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StudentReportContent({
    projectId,
    groupId,
}: StudentReportContentProps) {
    const { theme } = useTheme()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [questionProgress, setQuestionProgress] = useState<
        QuestionProgress[]
    >([])

    // Custom hooks
    const {
        project,
        group,
        reportDefinition,
        isLoading,
        accessDenied,
        refreshData,
    } = useReportData(projectId, groupId)
    const { syncStatus } = useReportSync()

    // Get submission status from group data
    const isReportSubmitted = group?.reportSubmitted || false
    const reportSubmittedDate = group?.reportSubmittedDate

    // Get threads for comment count
    const { threads } = useThreads({ query: { resolved: false } })

    // File upload handler
    const uploadFile = useMemo(() => createS3UploadForReports(), [])

    // Create collaborative BlockNote editor for classic format
    const classicEditor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks({
        uploadFile,
    })

    // Determine if we should use dark theme for BlockNote
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
    }, [theme])

    // Handle progress updates from individual question editors with throttling
    const progressUpdateTimeouts = useRef<Map<string, NodeJS.Timeout>>(
        new Map()
    )

    const handleProgressUpdate = useCallback(
        (questionId: string, progress: QuestionProgress) => {
            // Clear existing timeout for this question
            const existingTimeout =
                progressUpdateTimeouts.current.get(questionId)
            if (existingTimeout) {
                clearTimeout(existingTimeout)
            }

            // Set new timeout to batch updates
            const newTimeout = setTimeout(() => {
                setQuestionProgress((prev) => {
                    const existing = prev.find(
                        (p) => p.questionId === questionId
                    )

                    // Only update if there's a meaningful change
                    if (existing) {
                        if (
                            existing.hasContent !== progress.hasContent ||
                            Math.abs(
                                existing.characterCount -
                                    progress.characterCount
                            ) > 10
                        ) {
                            return prev.map((p) =>
                                p.questionId === questionId ? progress : p
                            )
                        }
                        return prev
                    } else {
                        return [...prev, progress]
                    }
                })
                progressUpdateTimeouts.current.delete(questionId)
            }, 100) // Small delay to batch rapid updates

            progressUpdateTimeouts.current.set(questionId, newTimeout)
        },
        []
    )

    // Calculate progress for questionnaire
    const completedAnswers = questionProgress.filter((p) => p.hasContent).length
    const totalQuestions = reportDefinition?.questions?.length || 0
    const progressPercentage =
        totalQuestions > 0
            ? Math.round((completedAnswers / totalQuestions) * 100)
            : 0

    const handleSubmit = async () => {
        if (!groupId) {
            console.error('Group ID is required for submission')
            return
        }

        setIsSubmitting(true)
        try {
            console.log('Submitting report for group:', groupId)
            const response = await groupService.submitReport(groupId)

            if (response.success) {
                console.log('Report submitted successfully')
                // Refresh data to get updated submission status
                await refreshData()
            } else {
                console.error('Failed to submit report:', response.error)
                // You could add toast notification here
            }
        } catch (error) {
            console.error('Failed to submit report:', error)
            // You could add toast notification here
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <ReportLoadingState />
    }

    if (accessDenied) {
        return <ReportAccessDeniedState message={accessDenied} />
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
                                    {project?.name || 'Loading...'}
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
                        Project Report - {project?.name || 'Loading...'}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-muted-foreground">
                            {isLoading
                                ? 'Loading...'
                                : project?.name || 'Unknown Project'}
                        </p>
                        {group && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                >
                                    {group.name}
                                </Badge>
                            </>
                        )}
                        {reportDefinition && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <Badge
                                    variant={
                                        reportDefinition.format ===
                                        'QUESTIONNAIRE'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className={
                                        reportDefinition.format ===
                                        'QUESTIONNAIRE'
                                            ? 'bg-blue-600 text-white'
                                            : ''
                                    }
                                >
                                    {reportDefinition.format === 'QUESTIONNAIRE'
                                        ? 'Questionnaire'
                                        : 'Classic Report'}
                                </Badge>
                            </>
                        )}
                    </div>
                </div>

                <SplitCollapsibleRightLayout
                    sidebarTitle={'Guide'}
                    sidebarContent={
                        <div className="space-y-4">
                            <ReportInstructionsCard
                                reportDefinition={reportDefinition}
                                isLoading={isLoading}
                            />
                            <ReportProgressCard
                                reportDefinition={reportDefinition}
                                completedAnswers={completedAnswers}
                                progressPercentage={progressPercentage}
                            />
                            <ThreadsPanel />
                        </div>
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
                                                {group
                                                    ? `${group.name} Report`
                                                    : 'Your Report'}
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    isReportSubmitted
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    isReportSubmitted
                                                        ? 'bg-green-600 text-white '
                                                        : 'bg-orange-500 text-white'
                                                }
                                            >
                                                {isReportSubmitted
                                                    ? 'Submitted'
                                                    : 'Draft'}
                                            </Badge>
                                            {threads.length > 0 && (
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                    <MessageSquare className="w-3 h-3 mr-1" />
                                                    {threads.length} Comments
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            {reportDefinition?.format ===
                                            'QUESTIONNAIRE'
                                                ? 'Answer the questions from the instructions panel using the collaborative rich text editor below.'
                                                : 'Write your project report using the collaborative rich text editor below.'}
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
                                                    isReportSubmitted ||
                                                    (reportDefinition?.format ===
                                                        'QUESTIONNAIRE' &&
                                                        completedAnswers === 0)
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : isReportSubmitted ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Submitted
                                                        {reportSubmittedDate && (
                                                            <span className="text-xs ml-1">
                                                                {new Date(
                                                                    reportSubmittedDate
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        )}
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
                                {reportDefinition?.format === 'CLASSIC' ? (
                                    // Classic format: Single BlockNote editor
                                    <div className="min-h-[75vh] border rounded-md relative">
                                        <BlockNoteView
                                            editor={classicEditor}
                                            theme={
                                                isDarkMode ? 'dark' : 'light'
                                            }
                                            className="full-height-blocknote"
                                        />

                                        {/* Comments Components */}
                                        {classicEditor && (
                                            <>
                                                <FloatingThreads
                                                    editor={classicEditor}
                                                    threads={threads}
                                                    className="floating-threads"
                                                />
                                                <FloatingComposer
                                                    editor={classicEditor}
                                                    className="floating-composer"
                                                />
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    // Questionnaire format: Multiple collaborative editors for questions
                                    <div className="space-y-8">
                                        {reportDefinition?.questions?.map(
                                            (question, index) => (
                                                <div key={question.id}>
                                                    <MemoizedCollaborativeQuestionEditor
                                                        question={question}
                                                        index={index}
                                                        isDarkMode={isDarkMode}
                                                        uploadFile={uploadFile}
                                                        onProgressUpdate={
                                                            handleProgressUpdate
                                                        }
                                                    />
                                                    {index <
                                                        (reportDefinition
                                                            ?.questions
                                                            ?.length || 0) -
                                                            1 && (
                                                        <Separator className="mt-6" />
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 text-xs text-muted-foreground">
                                    <p>
                                        💡 <strong>Tip:</strong> Your work is
                                        automatically saved as you type. Use the
                                        toolbar to format your text, add
                                        headings, lists, and more.{' '}
                                        <strong>
                                            Select text to add comments
                                        </strong>{' '}
                                        for self-notes or collaboration.{' '}
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

export default function StudentReport() {
    const { projectId, groupId } = useParams<{
        projectId: string
        groupId: string
    }>()

    if (!projectId || !groupId) {
        return <div>Error: Missing project or group information</div>
    }

    const roomId = `project-${projectId}-group-${groupId}-report`

    console.log('StudentReport room setup:', {
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
            <ClientSideSuspense
                fallback={
                    <div className="min-h-screen flex items-center justify-center bg-background">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="text-center">
                                <p className="text-lg font-medium">
                                    Loading collaborative editor...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Preparing your workspace
                                </p>
                            </div>
                        </div>
                    </div>
                }
            >
                <StudentReportContent projectId={projectId} groupId={groupId} />
            </ClientSideSuspense>
        </CustomRoomProvider>
    )
}
