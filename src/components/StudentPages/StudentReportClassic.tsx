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
import {
    FloatingComposer,
    FloatingThreads,
    useCreateBlockNoteWithLiveblocks,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, MessageSquare, SendIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    ClientSideSuspense,
    useStatus,
    useThreads,
} from '@liveblocks/react/suspense'
import { useParams } from 'react-router'
import { RoomProvider as CustomRoomProvider } from '@/lib/liveblocks'
import { Badge } from '@/components/ui/badge'
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

interface StudentReportClassicContentProps {
    projectId: string
    groupId: string
}

interface QuestionProgress {
    questionId: string
    hasContent: boolean
    characterCount: number
}

interface QuestionEditorProps {
    question: { id: string; text: string }
    index: number
    isDarkMode: boolean
    uploadFile: any
    onProgressUpdate?: (questionId: string, progress: QuestionProgress) => void
}

function CollaborativeQuestionEditor({
    question,
    index,
    isDarkMode,
    uploadFile,
    onProgressUpdate,
}: QuestionEditorProps) {
    const [progress, setProgress] = useState<QuestionProgress>({
        questionId: question.id,
        hasContent: false,
        characterCount: 0,
    })
    // Create a collaborative editor for this specific question with unique field
    const editor = useCreateBlockNoteWithLiveblocks(
        {
            uploadFile,
        },
        {
            // Use question ID as the field to create separate documents within the same room
            field: `question-${question.id}`,
        }
    )

    // Get threads for this specific question field
    const { threads } = useThreads({
        query: {
            resolved: false,
            metadata: {
                field: `question-${question.id}`,
            },
        },
    })

    useCallback(() => {
        if (!onProgressUpdate) return

        const timeoutId = setTimeout(async () => {
            try {
                if (editor) {
                    const content = editor.document
                    const textContent = await editor.blocksToFullHTML(content)
                    const hasContent =
                        textContent.replace(/<[^>]*>/g, '').trim().length > 0
                    const characterCount = textContent.replace(
                        /<[^>]*>/g,
                        ''
                    ).length

                    const progressData = {
                        questionId: question.id,
                        hasContent,
                        characterCount,
                    }

                    // Only update if there's actually a change to avoid unnecessary re-renders
                    setProgress((prev) => {
                        if (
                            prev.hasContent !== progressData.hasContent ||
                            Math.abs(
                                prev.characterCount -
                                    progressData.characterCount
                            ) > 5
                        ) {
                            onProgressUpdate(question.id, progressData)
                            return progressData
                        }
                        return prev
                    })
                }
            } catch (error) {
                console.error('Error updating progress:', error)
            }
        }, 3000) // Longer debounce - 3 seconds

        return () => clearTimeout(timeoutId)
    }, [editor, question.id, onProgressUpdate])
    const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (editor) {
            const handleChange = () => {
                // Clear existing timeout
                if (progressTimeoutRef.current) {
                    clearTimeout(progressTimeoutRef.current)
                }

                // Set new timeout
                progressTimeoutRef.current = setTimeout(async () => {
                    try {
                        if (editor && onProgressUpdate) {
                            const content = editor.document
                            const textContent =
                                await editor.blocksToFullHTML(content)
                            const hasContent =
                                textContent.replace(/<[^>]*>/g, '').trim()
                                    .length > 0
                            const characterCount = textContent.replace(
                                /<[^>]*>/g,
                                ''
                            ).length

                            const progressData = {
                                questionId: question.id,
                                hasContent,
                                characterCount,
                            }

                            // Batch updates to minimize re-renders
                            setProgress((prev) => {
                                if (
                                    prev.hasContent !==
                                        progressData.hasContent ||
                                    Math.abs(
                                        prev.characterCount -
                                            progressData.characterCount
                                    ) > 10
                                ) {
                                    // Use setTimeout to defer the parent update
                                    setTimeout(
                                        () =>
                                            onProgressUpdate(
                                                question.id,
                                                progressData
                                            ),
                                        0
                                    )
                                    return progressData
                                }
                                return prev
                            })
                        }
                    } catch (error) {
                        console.error('Error updating progress:', error)
                    }
                }, 3000) // 3 second debounce
            }

            const unsubscribe = editor.onChange(handleChange)

            // Initial progress calculation
            handleChange()

            return () => {
                if (unsubscribe) unsubscribe()
                if (progressTimeoutRef.current) {
                    clearTimeout(progressTimeoutRef.current)
                }
            }
        }
    }, [editor, question.id, onProgressUpdate])

    if (!editor) {
        return (
            <div className="min-h-[20vh] border rounded-md flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading editor...
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
                        {threads.length > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {threads.length} Comment
                                {threads.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    <div className="min-h-[20vh] border rounded-md relative">
                        <BlockNoteView
                            editor={editor}
                            theme={isDarkMode ? 'dark' : 'light'}
                            className="question-blocknote"
                        />

                        {/* Comments Components for this question */}
                        {editor && (
                            <>
                                {/* Use FloatingThreads for closeable comment display */}
                                <FloatingThreads
                                    editor={editor as any}
                                    threads={threads}
                                    className="floating-threads"
                                />
                                {/* FloatingComposer for creating new comments */}
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
                        <span>
                            {progress.hasContent ? (
                                <span className="text-green-600 font-medium">
                                    ✓ Answered
                                </span>
                            ) : (
                                <span className="text-orange-600">
                                    Not answered
                                </span>
                            )}
                        </span>
                        <span className="text-muted-foreground">
                            {progress.characterCount} characters
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Memoize the component with deep comparison to prevent unnecessary re-renders during text selection
const MemoizedCollaborativeQuestionEditor = React.memo(
    CollaborativeQuestionEditor,
    (prevProps, nextProps) => {
        // Only re-render if essential props change
        return (
            prevProps.question.id === nextProps.question.id &&
            prevProps.question.text === nextProps.question.text &&
            prevProps.index === nextProps.index &&
            prevProps.isDarkMode === nextProps.isDarkMode &&
            prevProps.uploadFile === nextProps.uploadFile
            // Intentionally exclude onProgressUpdate to prevent re-renders from parent state changes
        )
    }
)

function StudentReportClassicContent({
    projectId,
    groupId,
}: StudentReportClassicContentProps) {
    const { theme } = useTheme()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [reportStatus, setReportStatus] = useState<'draft' | 'submitted'>(
        'draft'
    )
    const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())
    const [project, setProject] = useState<Project | null>(null)
    const [group, setGroup] = useState<ProjectGroup | null>(null)
    const [reportDefinition, setReportDefinition] =
        useState<ReportDefinition | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // State for tracking questionnaire progress
    const [questionProgress, setQuestionProgress] = useState<
        QuestionProgress[]
    >([])

    const status = useStatus()

    // Progress tracking will be handled by individual editors

    // Fetch project and group data
    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !groupId) return

            setIsLoading(true)

            // Debug logging
            console.log('StudentReportClassic - URL params:', {
                projectId,
                groupId,
            })
            console.log('StudentReportClassic - About to call APIs with:', {
                projectEndpoint: `projects/${projectId}`,
                groupEndpoint: `projectGroups/${groupId}`,
                reportDefEndpoint: `projects/${projectId}/report-definition`,
            })

            try {
                const [projectResponse, groupResponse, reportDefResponse] =
                    await Promise.all([
                        projectService.getOneById(projectId),
                        groupService.getOneById(groupId),
                        reportDefinitionService.getReportDefinition(projectId),
                    ])

                console.log('API Responses:', {
                    projectResponse: {
                        success: projectResponse.success,
                        data: !!projectResponse.data,
                        error: projectResponse.error,
                    },
                    groupResponse: {
                        success: groupResponse.success,
                        data: !!groupResponse.data,
                        error: groupResponse.error,
                    },
                    reportDefResponse: {
                        success: reportDefResponse.success,
                        data: !!reportDefResponse.data,
                        error: reportDefResponse.error,
                    },
                })

                if (projectResponse.success && projectResponse.data) {
                    setProject(projectResponse.data as Project)
                    console.log('Project loaded:', projectResponse.data)
                } else {
                    console.error('Project loading failed:', projectResponse)
                }

                if (groupResponse.success && groupResponse.data) {
                    setGroup(groupResponse.data as ProjectGroup)
                    console.log('Group loaded:', groupResponse.data)
                } else {
                    console.error('Group loading failed:', groupResponse)
                }

                if (reportDefResponse.success && reportDefResponse.data) {
                    const reportDef = reportDefResponse.data
                    setReportDefinition(reportDef)
                    console.log('Report definition loaded:', reportDef)

                    // Check if report is active
                    if (!reportDef.isActive) {
                        console.log(
                            'Access denied: Report not active:',
                            reportDef.isActive
                        )
                        setAccessDenied(
                            'This report is not currently active. Please contact your instructor.'
                        )
                        return
                    }
                } else {
                    // No report definition found
                    console.log(
                        'Access denied: No report definition found:',
                        reportDefResponse
                    )
                    setAccessDenied(
                        'Report is deactivated for this project. Please contact your instructor.'
                    )
                    return
                }
            } catch (error) {
                console.error(
                    'Error fetching project/group/report definition data:',
                    error
                )
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [projectId, groupId])

    // Note: Questionnaire initialization is now handled by Liveblocks collaborative storage

    // Get threads for comment count
    const { threads } = useThreads({ query: { resolved: false } })

    // Use the default upload function (you can customize this for your backend)
    const uploadFile = useMemo(() => createS3UploadForReports(), [])

    // Create collaborative BlockNote editor with theme support and file upload (for Classic format)
    const classicEditor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks({
        uploadFile,
    })

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

    // Helper function to get progress for a specific question
    const getQuestionProgress = useCallback(
        (questionId: string) => {
            return questionProgress.find((p) => p.questionId === questionId)
        },
        [questionProgress]
    )

    // Determine if we should use dark theme for BlockNote
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
    }, [theme])

    // Calculate progress for questionnaire based on tracked progress
    const completedAnswers = questionProgress.filter((p) => p.hasContent).length
    const totalQuestions = reportDefinition?.questions?.length || 0
    const progressPercentage =
        totalQuestions > 0
            ? Math.round((completedAnswers / totalQuestions) * 100)
            : 0

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading project information...</span>
                </div>
            </div>
        )
    }

    if (accessDenied) {
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
                            <p className="text-muted-foreground">
                                {accessDenied}
                            </p>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Instructions
                                    </CardTitle>
                                    <CardDescription>
                                        {isLoading
                                            ? 'Loading instructions...'
                                            : reportDefinition?.format ===
                                                'QUESTIONNAIRE'
                                              ? 'Answer the questions below in your report'
                                              : 'Follow these guidelines when writing your report'}
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
                                                            Questions to Answer:
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
                                                        provided. Please write a
                                                        comprehensive report
                                                        about your project.
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            Report is deactivate for this
                                            project. Please contact your
                                            instructor.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Progress Card for Questionnaire */}
                            {reportDefinition?.format === 'QUESTIONNAIRE' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Progress
                                        </CardTitle>
                                        <CardDescription>
                                            {completedAnswers} of{' '}
                                            {reportDefinition?.questions
                                                ?.length || 0}{' '}
                                            questions answered
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Completion</span>
                                                <span>
                                                    {progressPercentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${progressPercentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Comment Threads Panel */}
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
                                                    reportStatus ===
                                                        'submitted' ||
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
                                                {/* Use FloatingThreads for closeable comment display */}
                                                <FloatingThreads
                                                    editor={classicEditor}
                                                    threads={threads}
                                                    className="floating-threads"
                                                />
                                                {/* FloatingComposer for creating new comments */}
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
                    {threads.length} active thread{threads.length !== 1 ? 's' : ''}
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

export default function StudentReportClassic() {
    const { projectId, groupId } = useParams<{
        projectId: string
        groupId: string
    }>()

    if (!projectId || !groupId) {
        return <div>Error: Missing project or group information</div>
    }

    const roomId = `project-${projectId}-group-${groupId}-report`

    console.log('StudentReportClassic room setup:', {
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
                fallback={<div>Loading collaborative editor...</div>}
            >
                <StudentReportClassicContent
                    projectId={projectId}
                    groupId={groupId}
                />
            </ClientSideSuspense>
        </CustomRoomProvider>
    )
}
