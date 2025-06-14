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
import { Label } from '@/components/ui/label'
import SplitCollapsibleRightLayout from '@/components/layout/SplitCollapsibleRightLayout.tsx'
import { useTheme } from '@/components/ui/theme-provider'
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { SaveIcon, SendIcon } from 'lucide-react'

// Mock data for demonstration
const mockProject = {
    id: '1',
    name: 'Mobile App Development Project',
    description: 'Design and develop a mobile application for iOS/Android',
}

const mockInstructions = `Please answer all questions thoroughly and honestly. Your responses will help us evaluate your learning progress and project development skills.

Take your time to reflect on each question and provide specific examples where possible. There are no right or wrong answers - we want to understand your thought process and learning experience.`

const mockQuestions = [
    {
        id: '1',
        text: 'Describe the main problem your mobile app solves and explain why this problem is important to address.',
    },
    {
        id: '2',
        text: 'What technologies and frameworks did you choose for your mobile app development? Justify your choices and explain any trade-offs you considered.',
    },
    {
        id: '3',
        text: 'Walk us through your design process. How did you approach user interface design and user experience considerations?',
    },
    {
        id: '4',
        text: 'What were the most significant technical challenges you encountered during development, and how did you overcome them?',
    },
    {
        id: '5',
        text: 'How did you test your application? Describe your testing strategy and any bugs or issues you discovered and resolved.',
    },
    {
        id: '6',
        text: 'Reflect on your learning experience. What skills did you develop or improve during this project?',
    },
]

interface QuestionAnswer {
    questionId: string
    answer: PartialBlock[]
    textContent: string
}

interface QuestionEditor {
    questionId: string
    editor: BlockNoteEditor
}

export default function StudentReportQuestionnaire() {
    const { theme } = useTheme()
    const [answers, setAnswers] = useState<QuestionAnswer[]>(
        mockQuestions.map((q) => ({
            questionId: q.id,
            answer: [{ type: 'paragraph', content: '' }],
            textContent: '',
        }))
    )
    const [editors, setEditors] = useState<QuestionEditor[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Determine if we should use dark theme for BlockNote
    const isDarkMode = useMemo(() => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return theme === 'dark'
    }, [theme])

    // Initialize editors for each question
    useEffect(() => {
        const questionEditors = mockQuestions.map((question) => {
            const editor = BlockNoteEditor.create({
                initialContent: [{ type: 'paragraph', content: '' }],
            })

            // Set up onChange listener to update answers
            editor.onChange(async () => {
                const content = editor.document
                // Simple text extraction - get text content from all blocks
                const htmlContent = await editor.blocksToFullHTML(content)
                const textContent = htmlContent.replace(/<[^>]*>/g, '').trim()

                setAnswers((prev) =>
                    prev.map((a) =>
                        a.questionId === question.id
                            ? { ...a, answer: content, textContent }
                            : a
                    )
                )
            })

            return {
                questionId: question.id,
                editor,
            }
        })

        setEditors(questionEditors)
    }, [])

    const getAnswer = (questionId: string) => {
        return answers.find((a) => a.questionId === questionId)
    }

    const getEditor = (questionId: string) => {
        return editors.find((e) => e.questionId === questionId)?.editor
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            console.log('Saving report answers:', answers)
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
            console.log('Submitting report answers:', answers)
            // TODO: Implement submit functionality
            await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
        } catch (error) {
            console.error('Error submitting report:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const completedAnswers = answers.filter(
        (a) => a.textContent.trim().length > 0
    ).length
    const progressPercentage = Math.round(
        (completedAnswers / mockQuestions.length) * 100
    )

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
                    sidebarTitle="Guide"
                    sidebarContent={
                        <div className="space-y-4">
                            {/* Instructions Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Instructions
                                    </CardTitle>
                                    <CardDescription>
                                        Please read before answering the
                                        questions
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

                            {/* Progress Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Progress
                                    </CardTitle>
                                    <CardDescription>
                                        {completedAnswers} of{' '}
                                        {mockQuestions.length} questions
                                        answered
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Completion</span>
                                            <span>{progressPercentage}%</span>
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
                        </div>
                    }
                >
                    {/* Questions Card - Main Content */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        Questions
                                    </CardTitle>
                                    <CardDescription>
                                        Answer all questions to complete your
                                        report
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2"
                                    >
                                        <SaveIcon className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Draft'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={
                                            isSubmitting ||
                                            completedAnswers === 0
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <SendIcon className="h-4 w-4" />
                                        {isSubmitting
                                            ? 'Submitting...'
                                            : 'Submit Report'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {mockQuestions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <Label className="text-base font-medium leading-relaxed">
                                                    {question.text}
                                                </Label>
                                                <div className="min-h-[20vh] border rounded-md">
                                                    {(() => {
                                                        const editor =
                                                            getEditor(
                                                                question.id
                                                            )
                                                        return editor ? (
                                                            <BlockNoteView
                                                                editor={editor}
                                                                theme={
                                                                    isDarkMode
                                                                        ? 'dark'
                                                                        : 'light'
                                                                }
                                                                className="question-blocknote"
                                                            />
                                                        ) : null
                                                    })()}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        {(
                                                            getAnswer(
                                                                question.id
                                                            )?.textContent || ''
                                                        ).trim().length > 0 ? (
                                                            <span className="text-green-600 font-medium">
                                                                ✓ Answered
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-600">
                                                                Not answered
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span>
                                                        {getAnswer(question.id)
                                                            ?.textContent
                                                            .length || 0}{' '}
                                                        characters
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {index < mockQuestions.length - 1 && (
                                            <Separator className="mt-6" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 text-xs text-muted-foreground">
                                <p>
                                    💡 <strong>Tip:</strong> Your answers are
                                    automatically saved as you type. Take your
                                    time to provide thoughtful responses.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </SplitCollapsibleRightLayout>

                {/* Status Bar */}
                <div className="flex items-center justify-between py-4 px-6 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                            Status:{' '}
                            <strong className="text-orange-600">Draft</strong>
                        </span>
                        <span>
                            Last saved: <strong>2 minutes ago</strong>
                        </span>
                        <span>
                            Progress:{' '}
                            <strong className="text-primary">
                                {completedAnswers}/{mockQuestions.length}{' '}
                                questions
                            </strong>
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Due date:{' '}
                        <strong className="text-foreground">
                            March 15, 2024
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    )
}
