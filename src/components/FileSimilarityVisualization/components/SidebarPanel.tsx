import React from 'react'
import { Node, ReactFlowInstance } from 'reactflow'
import {
    ArrowLeftRight,
    BarChart3,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ExternalLink,
    Files,
    Loader2,
    Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    FilePair,
    LayoutState,
    SimilarityResponse,
    SubmissionSimilarity,
} from '../types'
import { ComparisonContext } from '../hooks/useComparisonContext'
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
    similarities?: SubmissionSimilarity[]
    currentSimilarityId?: string | null
    onSimilarityChange?: (similarityId: string) => void
    // Comparison context for meaningful display
    comparisonContext?: ComparisonContext | null
    projectId?: string
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    collapsed,
    onToggleCollapse,
    data,
    currentPair,
    selectedPairIndex,
    layoutState,
    onPairChange,
    onPreviousPair,
    onNextPair,
    similarities,
    currentSimilarityId,
    onSimilarityChange,
    comparisonContext,
    projectId,
}) => {
    const navigate = useNavigate()
    useParams<{ submissionId: string }>()
    const nodeStats = getNodeStats(currentPair.react_flow?.nodes || [])

    const handleViewGroup = (groupId: string | undefined) => {
        if (!groupId || !projectId) {
            console.warn('Missing group ID or project ID for navigation', {
                groupId,
                projectId,
            })
            return
        }
        navigate(`/projects/${projectId}/groups/${groupId}`)
    }

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
                    {/* Submission Info & Similarity Selector */}
                    {data.submission_info && (
                        <div className="p-4 border-b border-sidebar-border">
                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center mb-2">
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Submission Analysis
                                    </h2>
                                </div>

                                {similarities && similarities.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-sidebar-foreground">
                                                Similarities Found
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {similarities.length}
                                            </Badge>
                                        </div>

                                        {similarities.length > 1 &&
                                            onSimilarityChange && (
                                                <Select
                                                    value={
                                                        currentSimilarityId ||
                                                        ''
                                                    }
                                                    onValueChange={
                                                        onSimilarityChange
                                                    }
                                                >
                                                    <SelectTrigger className="w-full h-8 text-xs">
                                                        <SelectValue placeholder="Select similarity..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {similarities.map(
                                                            (sim, index) => (
                                                                <SelectItem
                                                                    key={
                                                                        sim.similarity_id
                                                                    }
                                                                    value={
                                                                        sim.similarity_id
                                                                    }
                                                                    className="text-xs"
                                                                    disabled={
                                                                        sim.status ===
                                                                        'processing'
                                                                    }
                                                                >
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <span>
                                                                            Comparison{' '}
                                                                            {index +
                                                                                1}
                                                                        </span>
                                                                        {sim.status ===
                                                                        'processing' ? (
                                                                            <div className="flex items-center gap-1 ml-2">
                                                                                <div className="h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                                                <span className="text-xs text-orange-600">
                                                                                    Processing
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <Badge
                                                                                variant={
                                                                                    sim.overall_similarity >
                                                                                    0.7
                                                                                        ? 'destructive'
                                                                                        : sim.overall_similarity >
                                                                                            0.3
                                                                                          ? 'secondary'
                                                                                          : 'outline'
                                                                                }
                                                                                className="text-xs ml-2"
                                                                            >
                                                                                {(
                                                                                    sim.overall_similarity *
                                                                                    100
                                                                                ).toFixed(
                                                                                    1
                                                                                )}

                                                                                %
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                        {currentSimilarityId && (
                                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                                                <div className="grid grid-cols-2 gap-1">
                                                    {(() => {
                                                        const currentSim =
                                                            similarities.find(
                                                                (s) =>
                                                                    s.similarity_id ===
                                                                    currentSimilarityId
                                                            )
                                                        return currentSim ? (
                                                            <>
                                                                <div>
                                                                    Overall:{' '}
                                                                    {(
                                                                        currentSim.overall_similarity *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </div>
                                                                <div>
                                                                    Jaccard:{' '}
                                                                    {(
                                                                        currentSim.jaccard_similarity *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </div>
                                                                <div>
                                                                    Type:{' '}
                                                                    {(
                                                                        currentSim.type_similarity *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </div>
                                                                <div>
                                                                    Flow:{' '}
                                                                    {(
                                                                        currentSim.flow_similarity *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </div>
                                                            </>
                                                        ) : null
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comparison Context Display */}
                    {comparisonContext && (
                        <div className="p-4 border-b border-sidebar-border">
                            <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center mb-3">
                                <ArrowLeftRight className="h-4 w-4 mr-2" />
                                Submission Comparison
                            </h2>

                            <div className="space-y-4">
                                {/* Step Information */}
                                <div className="text-center">
                                    <Badge
                                        variant="secondary"
                                        className="text-sm px-3 py-1"
                                    >
                                        Step: {comparisonContext.stepName}
                                    </Badge>
                                </div>

                                {/* Submission 1 */}
                                <div className="bg-muted rounded p-3">
                                    <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Users className="inline h-4 w-4 mr-1" />
                                            Group:{' '}
                                            {
                                                comparisonContext.submission1
                                                    .groupName
                                            }
                                        </div>
                                        {comparisonContext.submission1
                                            .groupId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleViewGroup(
                                                        comparisonContext
                                                            .submission1.groupId
                                                    )
                                                }
                                                title="View group details"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    {comparisonContext.submission1
                                        .groupMembers &&
                                        comparisonContext.submission1
                                            .groupMembers.length > 0 && (
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <div className="font-medium">
                                                    Members:
                                                </div>
                                                {comparisonContext.submission1.groupMembers.map(
                                                    (member) => (
                                                        <div
                                                            key={member.user_id}
                                                            className="ml-2"
                                                        >
                                                            •{' '}
                                                            {member.first_name}{' '}
                                                            {member.last_name}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    {comparisonContext.submission1
                                        .uploadDateTime && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Uploaded:{' '}
                                            {new Date(
                                                comparisonContext.submission1.uploadDateTime
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* VS separator */}
                                <div className="text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-sidebar px-2 text-muted-foreground font-semibold">
                                                VS
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submission 2 */}
                                <div className="bg-muted rounded p-3">
                                    <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Users className="inline h-4 w-4 mr-1" />
                                            Group:{' '}
                                            {
                                                comparisonContext.submission2
                                                    .groupName
                                            }
                                        </div>
                                        {comparisonContext.submission2
                                            .groupId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleViewGroup(
                                                        comparisonContext
                                                            .submission2.groupId
                                                    )
                                                }
                                                title="View group details"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    {comparisonContext.submission2
                                        .groupMembers &&
                                        comparisonContext.submission2
                                            .groupMembers.length > 0 && (
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <div className="font-medium">
                                                    Members:
                                                </div>
                                                {comparisonContext.submission2.groupMembers.map(
                                                    (member) => (
                                                        <div
                                                            key={member.user_id}
                                                            className="ml-2"
                                                        >
                                                            •{' '}
                                                            {member.first_name}{' '}
                                                            {member.last_name}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    {comparisonContext.submission2
                                        .uploadDateTime && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Uploaded:{' '}
                                            {new Date(
                                                comparisonContext.submission2.uploadDateTime
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                                    {currentPair.react_flow?.has_similarity && (
                                        <Badge
                                            variant={getSimilarityBadgeVariant(
                                                currentPair.react_flow
                                                    ?.analysis_metadata
                                                    ?.average_similarity || 0
                                            )}
                                            className="text-xs"
                                        >
                                            {(
                                                (currentPair.react_flow
                                                    ?.analysis_metadata
                                                    ?.average_similarity || 0) *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm font-medium justify-items-center w-full text-sidebar-foreground">
                                    <div className="flex items-center text-xs text-sidebar-muted-foreground mb-1">
                                        📁{' '}
                                        {currentPair.react_flow?.file_metadata
                                            ?.file1?.name || 'File 1'}
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
                                                    {pair.file_pair?.file_from_submission1
                                                        ?.split('/')
                                                        ?.pop() ||
                                                        'Unknown'}{' '}
                                                    ↔{' '}
                                                    {pair.file_pair?.file_from_submission2
                                                        ?.split('/')
                                                        ?.pop() || 'Unknown'}
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
                                        {currentPair.react_flow?.has_similarity
                                            ? `${((currentPair.react_flow?.analysis_metadata?.average_similarity || 0) * 100).toFixed(1)}%`
                                            : 'None'}
                                    </span>
                                </div>
                                {currentPair.react_flow?.has_similarity && (
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-primary"
                                            style={{
                                                width: `${(currentPair.react_flow?.analysis_metadata?.average_similarity || 0) * 100}%`,
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
                    <div className="text-xs text-muted-foreground text-center p-2 rounded">
                        <div className="font-medium mb-1">
                            Keyboard shortcuts:
                        </div>
                        <div>
                            ← → Switch comparisons | ↑ ↓ Switch file pairs
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
