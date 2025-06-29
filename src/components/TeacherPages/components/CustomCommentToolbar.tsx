import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomCommentToolbarProps } from '../types'

export function CustomCommentToolbar({ editor }: CustomCommentToolbarProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!editor) return

        const checkSelection = () => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tiptapEditor = (editor as any)?._tiptapEditor
                if (!tiptapEditor) return

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tiptapEditor = (editor as any)?._tiptapEditor
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
        if (editor) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tiptapEditor = (editor as any)._tiptapEditor
                if (tiptapEditor) {
                    tiptapEditor.chain().focus().addPendingComment().run()
                    setIsVisible(false) // Hide toolbar after adding comment
                }
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
