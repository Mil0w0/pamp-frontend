import React from 'react'
import { Node } from 'reactflow'
import { Code, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FilePair } from '../types'
import {
    formatCode,
    getSimilarityScoreDisplay,
    getSimilarityBadgeVariant,
} from '../utils'

interface ComparisonDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedNode: Node | null
    currentPair: FilePair
}

export const ComparisonDialog: React.FC<ComparisonDialogProps> = ({
    isOpen,
    onOpenChange,
    selectedNode,
    currentPair,
}) => {
    // Copy code to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            console.log('Code copied to clipboard')
        } catch (err) {
            console.error('Failed to copy code:', err)
        }
    }

    if (!selectedNode) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[90vw] !max-w-[100vw] !max-h-[90vh] !h-auto p-0">
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Code className="h-5 w-5 text-primary" />
                            <div>
                                <DialogTitle className="text-lg font-semibold">
                                    Code Similarity Comparison
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    <span className="flex items-center space-x-2 text-sm">
                                        <span>
                                            Function:{' '}
                                            {selectedNode.data?.label ||
                                                selectedNode.id}
                                        </span>
                                        <Badge
                                            variant={getSimilarityBadgeVariant(
                                                parseFloat(
                                                    getSimilarityScoreDisplay(
                                                        selectedNode,
                                                        currentPair
                                                    )
                                                ) / 100
                                            )}
                                            className="text-xs"
                                        >
                                            {getSimilarityScoreDisplay(
                                                selectedNode,
                                                currentPair
                                            )}
                                            % similar
                                        </Badge>
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden max-h-[calc(100vh_-_200px)]">
                    <div className="w-full h-full flex">
                        {/* File 1 Code */}
                        <div className="flex-1 border-r border-border max-w-[50%]">
                            <div className="bg-muted/30 px-4 py-2 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-foreground">
                                            {currentPair?.react_flow?.file_metadata?.file1?.name
                                                ?.split('/')
                                                .pop() || 'File 1'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                formatCode(
                                                    selectedNode.data
                                                        ?.source_code
                                                        ?.file1_code ||
                                                        selectedNode.data
                                                            ?.content ||
                                                        ''
                                                )
                                            )
                                        }
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 max-w-full overflow-auto max-h-[60vh]">
                                <pre className="text-sm bg-card rounded-md p-4 border overflow-x-auto">
                                    <code className="text-foreground font-mono whitespace-pre">
                                        {formatCode(
                                            selectedNode.data?.source_code
                                                ?.file1_code ||
                                                selectedNode.data?.content ||
                                                'No code content available'
                                        )}
                                    </code>
                                </pre>
                            </div>
                        </div>

                        {/* File 2 Code */}
                        <div className="flex-1 max-w-[50%]">
                            <div className="bg-muted/30 px-4 py-2 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-foreground">
                                            {currentPair?.react_flow?.file_metadata?.file2?.name
                                                ?.split('/')
                                                .pop() || 'File 2'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                formatCode(
                                                    selectedNode.data
                                                        ?.source_code
                                                        ?.file2_code ||
                                                        selectedNode.data
                                                            ?.content ||
                                                        ''
                                                )
                                            )
                                        }
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 overflow-auto max-h-[60vh]">
                                <pre className="text-sm bg-card rounded-md p-4 border overflow-x-auto">
                                    <code className="text-foreground font-mono whitespace-pre">
                                        {formatCode(
                                            selectedNode.data?.source_code
                                                ?.file2_code ||
                                                selectedNode.data?.content ||
                                                'No code content available'
                                        )}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with similarity details */}
                <div className="border-t border-border p-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-muted-foreground">
                                    Node Type:
                                </span>
                                <Badge variant="outline">
                                    {selectedNode.data?.type || 'unknown'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">
                                Similarity Score:
                            </span>
                            <Badge
                                variant={getSimilarityBadgeVariant(
                                    parseFloat(
                                        getSimilarityScoreDisplay(
                                            selectedNode,
                                            currentPair
                                        )
                                    ) / 100
                                )}
                            >
                                {getSimilarityScoreDisplay(
                                    selectedNode,
                                    currentPair
                                )}
                                %
                            </Badge>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
