import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    addEdge,
    Background,
    BackgroundVariant,
    Connection,
    ConnectionMode,
    Controls,
    Edge,
    Node,
    NodeChange,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useTheme } from '@/components/ui/theme-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {
    useFilePairNavigation,
    useReactFlowLayout,
    useSimilarityData,
} from './hooks'
import { ComparisonDialog } from './components/ComparisonDialog'
import { SidebarPanel } from './components/SidebarPanel'
import { VisualizationArea } from './components/VisualizationArea'

const FileSimilarityVisualizationPage: React.FC = () => {
    const { theme } = useTheme()

    // State management
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
    const [selectedSimilarityNode, setSelectedSimilarityNode] =
        useState<Node | null>(null)
    const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false)

    // Track initialization to prevent re-runs
    const isInitializedRef = useRef<boolean>(false)
    const lastZoomButtonClickRef = useRef<number>(0)

    // ReactFlow state
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    // Store stable references to prevent re-render loops
    const processNodesRef = useRef<
        ((nodes: Node[], edges: Edge[]) => Promise<Node[]>) | null
    >(null)
    const processEdgesRef = useRef<((edges: Edge[]) => Edge[]) | null>(null)

    // Custom hooks
    const { data, loading, error } = useSimilarityData()

    const {
        reactFlowInstance,
        setReactFlowInstance,
        layoutState,
        setLayoutState,
        processNodes,
        processEdgesWithTheme,
        applyFitView,
        onNodesChangeWithBoundaryUpdate,
    } = useReactFlowLayout({ sidebarCollapsed })

    // Update stable references
    processNodesRef.current = processNodes
    processEdgesRef.current = processEdgesWithTheme

    const {
        selectedPairIndex,
        handlePairChange,
        goToPreviousPair,
        goToNextPair,
    } = useFilePairNavigation({
        filePairs: data?.file_pairs || [],
        processNodes: processNodesRef.current || processNodes,
        processEdges: processEdgesRef.current || processEdgesWithTheme,
        onNodesChange: setNodes,
        onEdgesChange: setEdges,
        setLayoutState,
    })

    // ReactFlow event handlers
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    // Handle node clicks for similarity nodes
    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        console.log('Node clicked:', node)

        // Check if it's a similarity node (function with similarity or similarity comment)
        const isSimilarityNode =
            (node.data?.type === 'function' && node.data?.has_similarity) ||
            node.data?.type === 'similarity_comment'

        if (isSimilarityNode) {
            console.log('Similarity node clicked, opening comparison')
            setSelectedSimilarityNode(node)
            setIsComparisonOpen(true)
        }
    }, [])

    // Handle node changes with boundary updates
    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            onNodesChangeWithBoundaryUpdate(changes, onNodesChange, setNodes)
        },
        [onNodesChangeWithBoundaryUpdate, onNodesChange, setNodes]
    )

    // Throttled zoom button handler
    const handleZoomButtonClick = useCallback(() => {
        const now = Date.now()
        if (now - lastZoomButtonClickRef.current < 1000) {
            console.log('Zoom button click throttled')
            return
        }
        lastZoomButtonClickRef.current = now
        applyFitView()
    }, [applyFitView])

    // Initialize with first file pair when data loads
    useEffect(() => {
        if (
            data &&
            data.file_pairs &&
            data.file_pairs.length > 0 &&
            !isInitializedRef.current
        ) {
            console.log('Initializing with first file pair...')
            isInitializedRef.current = true

            const firstPair = data.file_pairs[0]

            console.log('First pair info:', {
                calculator_file: firstPair.file_pair?.calculator_file,
                game_file: firstPair.file_pair?.game_file,
                nodes_count: firstPair.react_flow?.nodes?.length,
                edges_count: firstPair.react_flow?.edges?.length,
                has_similarity: firstPair.react_flow?.has_similarity,
            })

            const initializeData = async () => {
                if (processNodesRef.current && processEdgesRef.current) {
                    const processedNodes = await processNodesRef.current(
                        firstPair.react_flow.nodes || [],
                        firstPair.react_flow.edges || []
                    )
                    setNodes(processedNodes)

                    // Process edges before setting them
                    const processedEdges = processEdgesRef.current(
                        firstPair.react_flow.edges || []
                    )
                    setEdges(processedEdges)

                    console.log('Initial nodes and edges set successfully')
                }
            }

            initializeData()
        }
    }, [data]) // Only depend on data

    // Apply initial zoom when nodes are loaded and ReactFlow instance is ready
    useEffect(() => {
        if (
            isInitializedRef.current &&
            reactFlowInstance &&
            nodes.length > 0 &&
            selectedPairIndex === 0 // Only for initial load
        ) {
            console.log(
                'Applying initial zoom after ReactFlow instance is ready...'
            )

            // Add a small delay to ensure nodes are rendered
            const timeoutId = setTimeout(() => {
                applyFitView()
            }, 300)

            return () => clearTimeout(timeoutId)
        }
    }, [reactFlowInstance, nodes, selectedPairIndex, applyFitView])

    // Handle theme changes by reloading the page
    useEffect(() => {
        // Skip if not initialized yet
        if (!isInitializedRef.current) return

        console.log('Theme changed, reloading page for fresh styling...')
        window.location.reload()
    }, [theme]) // Only depend on theme

    // Loading state
    if (loading) {
        console.log('Rendering loading state')
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Card className="w-96 p-8">
                    <CardContent className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <div className="text-lg font-medium text-foreground">
                            Loading AST similarity data...
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Preparing ELK layout visualization
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Check browser console for debug logs
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (error) {
        console.log('Rendering error state:', error)
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Card className="w-96 p-8 border-destructive">
                    <CardContent className="text-center space-y-4">
                        <div className="text-destructive text-6xl">⚠️</div>
                        <div className="text-xl font-semibold text-foreground">
                            Connection Error
                        </div>
                        <div className="text-destructive">{error}</div>
                        <div className="text-xs text-muted-foreground">
                            Check browser console for detailed logs
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="destructive"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // No data state
    if (!data || !data.file_pairs || data.file_pairs.length === 0) {
        console.log('Rendering empty data state')
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Card className="w-96 p-8">
                    <CardContent className="text-center space-y-4">
                        <div className="text-muted-foreground text-6xl">📊</div>
                        <div className="text-xl font-semibold text-foreground">
                            No Data Available
                        </div>
                        <div className="text-muted-foreground">
                            No similarity data found
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentPair = data.file_pairs[selectedPairIndex]

    // Invalid pair state
    if (!currentPair) {
        console.log('Current pair is null/undefined')
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Card className="w-96 p-8 border-secondary">
                    <CardContent className="text-center space-y-4">
                        <div className="text-secondary-foreground text-6xl">
                            ⚠️
                        </div>
                        <div className="text-xl font-semibold text-foreground">
                            Invalid Data State
                        </div>
                        <div className="text-muted-foreground">
                            Selected pair index is invalid
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Check browser console for debug info
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    console.log('Rendering main component')

    return (
        <>
            {/* Similarity Comparison Dialog */}
            <ComparisonDialog
                isOpen={isComparisonOpen}
                onOpenChange={setIsComparisonOpen}
                selectedNode={selectedSimilarityNode}
                currentPair={currentPair}
            />

            <div className="h-[calc(100vh_-_100px)] flex bg-background">
                {/* Sidebar */}
                <SidebarPanel
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() =>
                        setSidebarCollapsed(!sidebarCollapsed)
                    }
                    data={data}
                    currentPair={currentPair}
                    selectedPairIndex={selectedPairIndex}
                    layoutState={layoutState}
                    reactFlowInstance={reactFlowInstance}
                    nodes={nodes}
                    onPairChange={handlePairChange}
                    onPreviousPair={goToPreviousPair}
                    onNextPair={goToNextPair}
                    onApplyZoom={handleZoomButtonClick}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Top Bar */}
                    <div className="bg-card border-b border-border p-4">
                        <VisualizationArea.TopBar
                            currentPair={currentPair}
                            layoutState={layoutState}
                        />
                    </div>

                    {/* React Flow Container */}
                    <div className="flex-1 bg-muted/20">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={handleNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onInit={setReactFlowInstance}
                            connectionMode={ConnectionMode.Loose}
                            fitView={false}
                            minZoom={0.1}
                            maxZoom={1.5}
                            nodesDraggable={true}
                            nodesConnectable={false}
                            elementsSelectable={true}
                            attributionPosition="bottom-left"
                            className="bg-muted/20"
                            panOnDrag={true}
                            zoomOnScroll={true}
                            zoomOnPinch={true}
                            panOnScroll={false}
                            preventScrolling={true}
                            nodeOrigin={[0, 0]}
                            elevateEdgesOnSelect={true}
                            elevateNodesOnSelect={false}
                        >
                            <Controls showInteractive={false} />
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={30}
                                size={1.5}
                                color={theme === 'dark' ? '#374151' : '#e5e7eb'}
                            />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        </>
    )
}

export default FileSimilarityVisualizationPage
