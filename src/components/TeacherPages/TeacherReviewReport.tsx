import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useTheme } from '@/components/ui/theme-provider'
import { BlockNoteEditor } from '@blocknote/core'
import {
    useCreateBlockNoteWithLiveblocks,
    FloatingComposer,
    FloatingThreads,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { MessageSquare, User } from 'lucide-react'
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
import { useTeacherReportData, useTeacherReportSync } from './hooks'
import {
    CustomCommentToolbar,
    TeacherQuestionReview,
    TeacherThreadsPanel,
    GradingRubricCard,
} from './components'
import { TeacherReviewReportContentProps } from './types'

function ReportLoadingState() {
    return (
        <div className="min-h-[75vh] border rounded-md flex items-center justify-center">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading student report...</span>
            </div>
        </div>
    )
}

function NoReportState() {
    return (
        <div className="min-h-[75vh] border rounded-md flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="text-6xl">📄</div>
                <p className="text-muted-foreground">
                    No report format defined for this project.
                </p>
            </div>
        </div>
    )
}

function TeacherReviewReportContent({
    projectId,
    groupId,
}: TeacherReviewReportContentProps) {
    const { theme } = useTheme()

    // Custom hooks
    const { project, group, reportDefinition, isLoading } =
        useTeacherReportData(projectId, groupId)
    const { syncStatus, isGrading, activeCollaborators, handleGradeSubmit } =
        useTeacherReportSync()

    // Get threads for comment count
    const { threads } = useThreads({ query: { resolved: false } })

    // File upload handler
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

    // Determine if we should use dark theme for BlockNote
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
    }, [theme])

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
                            <GradingRubricCard
                                reportDefinition={reportDefinition}
                                isLoading={isLoading}
                                isGrading={isGrading}
                                onGradeSubmit={handleGradeSubmit}
                            />
                            <TeacherThreadsPanel />
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
                                    <ReportLoadingState />
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
                                                <FloatingThreads
                                                    editor={editor}
                                                    threads={threads}
                                                    className="floating-threads"
                                                />
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
                                            (
                                                question: {
                                                    id: string
                                                    text: string
                                                },
                                                index: number
                                            ) => (
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
                                    <NoReportState />
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
