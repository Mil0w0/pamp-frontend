import React from 'react'
import { Node, ReactFlowInstance } from 'reactflow'
import {
    ArrowLeftRight,
    BarChart3,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Files,
    Loader2,
    Target,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FilePair, LayoutState, SimilarityResponse } from '../types'
import { getNodeStats, getSimilarityBadgeVariant } from '../utils'

interface SidebarPanelProps {
    collapsed: boolean
    onToggleCollapse: () => void
    data: SimilarityResponse
    currentPair: FilePair
    selectedPairIndex: number
    layoutState: LayoutState
    reactFlowInstance: ReactFlowInstance | null
    nodes: Node[]
    onPairChange: (index: number) => void
    onPreviousPair: () => void
    onNextPair: () => void
    onApplyZoom: () => void
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    collapsed,
    onToggleCollapse,
    data,
    currentPair,
    selectedPairIndex,
    layoutState,
    reactFlowInstance,
    nodes,
    onPairChange,
    onPreviousPair,
    onNextPair,
    onApplyZoom,
}) => {
    const nodeStats = getNodeStats(currentPair.react_flow?.nodes || [])

    return (
        <div
            className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
                collapsed ? 'w-16' : 'w-80'
            } flex flex-col shadow-sm`}
        >
            <div className="border-b border-sidebar-border p-4 ">
                <div className="flex items-center justify-between w-full">
                    {!collapsed && (
                        <div>
                            <h1 className="text-xl font-bold text-sidebar-foreground">
                                Similarity representation
                            </h1>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleCollapse}
                        className="h-7 w-8 p-0 hover:bg-sidebar-accent"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-6 w-4" />
                        ) : (
                            <ChevronLeft className="h-6 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {!collapsed && (
                <div className="flex-1 overflow-y-auto bg-sidebar">
                    {/* Enhanced File Pair Navigator */}
                    <div className="p-4 border-b border-sidebar-border">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center">
                                <Files className="h-4 w-4 mr-2" />
                                File Pairs
                            </h2>
                            <Badge variant="outline" className="text-xs">
                                {selectedPairIndex + 1} of{' '}
                                {data.file_pairs.length}
                            </Badge>
                        </div>

                        {/* Current Pair Display */}
                        <Card className="mb-3 p-3 relative">
                            {layoutState.isTransitioning && (
                                <div className="absolute inset-0 bg-muted/50 rounded-md flex items-center justify-center z-10">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Current Comparison
                                    </span>
                                    {currentPair.react_flow.has_similarity && (
                                        <Badge
                                            variant={getSimilarityBadgeVariant(
                                                currentPair.react_flow
                                                    .analysis_metadata
                                                    .average_similarity
                                            )}
                                            className="text-xs"
                                        >
                                            {(
                                                currentPair.react_flow
                                                    .analysis_metadata
                                                    .average_similarity * 100
                                            ).toFixed(0)}
                                            %
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm font-medium justify-items-center w-full text-sidebar-foreground">
                                    <div className="flex items-center text-xs text-sidebar-muted-foreground mb-1">
                                        📁{' '}
                                        {
                                            currentPair.react_flow.file_metadata
                                                .file1.name
                                        }
                                    </div>
                                    <div className="flex items-center my-1">
                                        <ArrowLeftRight className="h-3 w-3 text-sidebar-muted-foreground rotate-90" />
                                    </div>
                                    <div className="flex items-center text-xs text-sidebar-muted-foreground">
                                        📁{' '}
                                        {
                                            currentPair.react_flow.file_metadata
                                                .file2.name
                                        }
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Navigation Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPreviousPair}
                                disabled={
                                    selectedPairIndex === 0 ||
                                    layoutState.isTransitioning
                                }
                                className="flex-1"
                            >
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onNextPair}
                                disabled={
                                    selectedPairIndex ===
                                        data.file_pairs.length - 1 ||
                                    layoutState.isTransitioning
                                }
                                className="flex-1"
                            >
                                Next
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </div>

                        {/* Quick Pair Selector Dropdown */}
                        <div className="mt-3">
                            <Select
                                value={selectedPairIndex.toString()}
                                onValueChange={(value) =>
                                    onPairChange(parseInt(value))
                                }
                                disabled={layoutState.isTransitioning}
                            >
                                <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder="Jump to pair..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.file_pairs.map((pair, index) => (
                                        <SelectItem
                                            key={index}
                                            value={index.toString()}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xs">
                                                    {pair.file_pair.calculator_file
                                                        .split('/')
                                                        .pop()}{' '}
                                                    ↔{' '}
                                                    {pair.file_pair.game_file
                                                        .split('/')
                                                        .pop()}
                                                </span>
                                                {pair.react_flow
                                                    .has_similarity && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-2 text-xs"
                                                    >
                                                        {(
                                                            pair.react_flow
                                                                .analysis_metadata
                                                                .average_similarity *
                                                            100
                                                        ).toFixed(0)}
                                                        %
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Keyboard Hint */}
                        <div className="mt-2 text-xs text-sidebar-muted-foreground text-center">
                            Use ↑↓ arrow keys to navigate
                        </div>
                    </div>

                    {/* Similarity Metrics */}
                    <div className="p-4 border-b border-sidebar-border">
                        <h2 className="text-sm font-semibold text-sidebar-foreground mb-3">
                            Similarity Metrics
                        </h2>
                        <div className="space-y-3">
                            <Card className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-sidebar-muted-foreground">
                                        Average Similarity
                                    </span>
                                    <span className="text-lg font-bold text-sidebar-foreground">
                                        {currentPair.react_flow.has_similarity
                                            ? `${(currentPair.react_flow.analysis_metadata.average_similarity * 100).toFixed(1)}%`
                                            : 'None'}
                                    </span>
                                </div>
                                {currentPair.react_flow.has_similarity && (
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-primary"
                                            style={{
                                                width: `${currentPair.react_flow.analysis_metadata.average_similarity * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-sidebar-muted-foreground">
                                        Shared Blocks
                                    </span>
                                    <Badge variant="secondary">
                                        {
                                            currentPair.react_flow
                                                .analysis_metadata
                                                .total_similarities
                                        }
                                    </Badge>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Node Statistics */}
                    <div className="p-4 border-b border-sidebar-border">
                        <h2 className="text-sm font-semibold text-sidebar-foreground mb-3">
                            <BarChart3 className="h-4 w-4 inline mr-2" />
                            Graph Statistics
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    📁 File Containers
                                </span>
                                <Badge variant="outline">
                                    {nodeStats.fileSubflows}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    📄 Legacy Files
                                </span>
                                <Badge variant="outline">
                                    {nodeStats.fileNodes}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    📦 Import Groups
                                </span>
                                <Badge variant="outline">
                                    {nodeStats.importGroups}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    ⚙️ Functions
                                </span>
                                <Badge variant="outline">
                                    {nodeStats.functionNodes}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    ⚡ Similar Functions
                                </span>
                                <Badge variant="destructive">
                                    {nodeStats.similarFunctions}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    💭 Comments
                                </span>
                                <Badge variant="outline">
                                    {nodeStats.similarityComments}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Layout Performance */}
                    <div className="p-4">
                        <h2 className="text-sm font-semibold text-sidebar-foreground mb-3">
                            <Zap className="h-4 w-4 inline mr-2" />
                            Layout Performance
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    🚀 Algorithm
                                </span>
                                <Badge variant="default">ELK Layered</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    📐 Node Dragging
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="text-green-600"
                                >
                                    ✓ Enabled
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    ⏱️ Processing
                                </span>
                                <Badge
                                    variant={
                                        layoutState.isApplyingLayout
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {layoutState.isApplyingLayout
                                        ? '⚡ Active'
                                        : '✓ Ready'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sidebar-muted-foreground">
                                    🔍 Current Zoom
                                </span>
                                <Badge variant="outline">
                                    {reactFlowInstance
                                        ? `${(reactFlowInstance.getZoom() * 100).toFixed(0)}%`
                                        : '---'}
                                </Badge>
                            </div>
                        </div>

                        {/* Zoom Controls */}
                        <Card className="mt-3 p-3">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-xs font-semibold flex items-center">
                                    <Target className="h-3 w-3 mr-1" />
                                    Zoom Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Button
                                    onClick={onApplyZoom}
                                    disabled={
                                        !reactFlowInstance ||
                                        nodes.length === 0 ||
                                        layoutState.isApplyingZoom
                                    }
                                    className="w-full text-xs h-8"
                                    size="sm"
                                >
                                    {layoutState.isApplyingZoom ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-1"></div>
                                            Applying Zoom...
                                        </>
                                    ) : (
                                        <>
                                            <Target className="h-3 w-3 mr-1" />
                                            Reset to Optimal Zoom
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-sidebar-muted-foreground mt-1">
                                    Automatically fits content to viewport
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
