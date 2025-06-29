import React, { useEffect, useRef, useState } from 'react'
import {
    FloatingComposer,
    FloatingThreads,
    useCreateBlockNoteWithLiveblocks,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import { useThreads } from '@liveblocks/react/suspense'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import { QuestionEditorProps, QuestionProgress } from '../types'

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
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    editor={editor as unknown as any}
                                    threads={threads}
                                    className="floating-threads"
                                />
                                {/* FloatingComposer for creating new comments */}
                                <FloatingComposer
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    editor={editor as unknown as any}
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
export const MemoizedCollaborativeQuestionEditor = React.memo(
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
