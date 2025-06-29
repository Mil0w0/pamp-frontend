import React from 'react'
import {
    useCreateBlockNoteWithLiveblocks,
    FloatingComposer,
    FloatingThreads,
} from '@liveblocks/react-blocknote'
import { BlockNoteView } from '@blocknote/mantine'
import { useThreads } from '@liveblocks/react/suspense'
import { MessageSquare } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CustomCommentToolbar } from './CustomCommentToolbar'
import { TeacherQuestionReviewProps } from '../types'

export function TeacherQuestionReview({
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
                            <CustomCommentToolbar editor={editor} />
                        </BlockNoteView>

                        {/* Comments Components for this question */}
                        {editor && (
                            <>
                                <FloatingThreads
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    editor={editor as unknown as any}
                                    threads={questionThreads}
                                    className="floating-threads"
                                />
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
