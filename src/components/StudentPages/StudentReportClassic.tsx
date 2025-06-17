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
import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { useCreateBlockNoteWithLiveblocks } from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useMemo, useState } from 'react'
import { SaveIcon, SendIcon } from 'lucide-react'
import {
    ClientSideSuspense,
    LiveblocksProvider,
    RoomProvider,
} from '@liveblocks/react/suspense'

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

const initialContent: PartialBlock[] = [
    {
        type: 'heading',
        content: 'Project Report',
    },
    {
        type: 'paragraph',
        content: 'Start writing your report here...',
    },
]

function StudentReportClassicContent() {
    const { theme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Create collaborative BlockNote editor with theme support
    const editor: BlockNoteEditor = useCreateBlockNoteWithLiveblocks({
        initialContent,
    })

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
            const content = editor.document
            console.log('Submitting report content:', content)
            // TODO: Implement submit functionality
            await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
        } catch (error) {
            console.error('Error submitting report:', error)
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
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        Your Report
                                    </CardTitle>
                                    <CardDescription>
                                        Write your project report using the
                                        collaborative rich text editor below
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
                                        disabled={isSubmitting}
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
                                    toolbar to format your text, add headings,
                                    lists, and more.{' '}
                                    <strong>
                                        Real-time collaboration enabled!
                                    </strong>
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
                            Words: <strong>0</strong>
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
