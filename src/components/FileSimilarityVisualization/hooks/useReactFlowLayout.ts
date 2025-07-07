import { useState, useCallback, useEffect } from 'react'
import { Node, Edge, ReactFlowInstance, NodeChange } from 'reactflow'
import { useTheme } from '@/components/ui/theme-provider'
import {
    applyELKLayout,
    calculateSubflowBoundaries,
    adjustChildPositions,
    processEdges,
    getNodeStyling,
} from '../utils'
import { LayoutState } from '../types'

interface UseReactFlowLayoutProps {
    sidebarCollapsed: boolean
}

export const useReactFlowLayout = ({
    sidebarCollapsed,
}: UseReactFlowLayoutProps) => {
    const { theme } = useTheme()
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null)
    const [layoutState, setLayoutState] = useState<LayoutState>({
        isApplyingLayout: false,
        isApplyingZoom: false,
        isTransitioning: false,
    })

    // Simple fitView function using React Flow's native method
    const applyFitView = useCallback(() => {
        if (!reactFlowInstance) {
            console.log('Cannot fit view: ReactFlow instance not available')
            return
        }

        console.log('Applying fit view...')
        setLayoutState((prev) => ({ ...prev, isApplyingZoom: true }))

        // Use React Flow's native fitView with padding
        reactFlowInstance.fitView({
            padding: 0.1, // 10% padding around content
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 1.5,
            duration: 300, // Smooth animation
        })

        // Clear applying state after animation
        setTimeout(() => {
            setLayoutState((prev) => ({ ...prev, isApplyingZoom: false }))
        }, 350)
    }, [reactFlowInstance])

    // Process nodes with ELK Layered layout
    const processNodes = useCallback(
        async (rawNodes: Node[], rawEdges: Edge[] = []): Promise<Node[]> => {
            console.log('Processing nodes with ELK Layered layout...')
            if (!rawNodes || rawNodes.length === 0) {
                return rawNodes
            }

            setLayoutState((prev) => ({ ...prev, isApplyingLayout: true }))

            // Apply proper styling based on node types
            const styledNodes = rawNodes.map((node) => {
                const styling = getNodeStyling(node, theme)

                return {
                    ...node,
                    style: styling,
                    // Ensure draggable and selectable properties
                    draggable: true,
                    selectable: true,
                }
            })

            // Apply ELK Layered layout algorithm
            try {
                const layoutedNodes = await applyELKLayout(
                    styledNodes,
                    rawEdges
                )

                console.log(
                    `ELK Layered layout applied to ${layoutedNodes.length} nodes with dynamic boundaries`
                )

                // Apply fit view after layout is complete
                setTimeout(() => {
                    applyFitView()
                }, 100) // Small delay to ensure nodes are rendered

                return layoutedNodes
            } catch (error) {
                console.error(
                    'ELK Layered layout failed, falling back to styled nodes:',
                    error
                )
                return styledNodes
            } finally {
                setLayoutState((prev) => ({ ...prev, isApplyingLayout: false }))
            }
        },
        [theme, applyFitView]
    )

    // Handle node changes and recalculate boundaries for file containers
    const onNodesChangeWithBoundaryUpdate = useCallback(
        (
            changes: NodeChange[],
            onNodesChange: (changes: NodeChange[]) => void,
            setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void
        ) => {
            onNodesChange(changes)

            // Recalculate boundaries after node position changes
            const hasPositionChanges = changes.some(
                (change) => change.type === 'position'
            )
            if (hasPositionChanges) {
                // Debounce boundary recalculation to avoid excessive updates
                setTimeout(() => {
                    setNodes((currentNodes) => {
                        const boundaries =
                            calculateSubflowBoundaries(currentNodes)
                        let updatedNodes = currentNodes.map((node) => {
                            if (node.data?.type === 'file_subflow') {
                                const bounds = boundaries.get(node.id)
                                if (bounds) {
                                    return {
                                        ...node,
                                        style: {
                                            ...node.style,
                                            width: `${bounds.width}px`,
                                            height: `${bounds.height}px`,
                                            minWidth: `${bounds.width}px`,
                                            minHeight: `${bounds.height}px`,
                                        },
                                    }
                                }
                            }
                            return node
                        })

                        // Adjust child positions to be relative to their containers
                        updatedNodes = adjustChildPositions(
                            updatedNodes,
                            boundaries
                        )
                        return updatedNodes
                    })
                }, 100) // 100ms debounce
            }
        },
        []
    )

    // Process edges with theme-aware styling
    const processEdgesWithTheme = useCallback(
        (rawEdges: Edge[]): Edge[] => {
            return processEdges(rawEdges, theme)
        },
        [theme]
    )

    // Handle sidebar toggle - refit view when sidebar changes
    useEffect(() => {
        if (reactFlowInstance) {
            // Small delay to allow sidebar animation to complete
            const timeoutId = setTimeout(() => {
                applyFitView()
            }, 350)

            return () => clearTimeout(timeoutId)
        }
    }, [sidebarCollapsed, applyFitView])

    // Handle window resize - refit view when window resizes
    useEffect(() => {
        const handleResize = () => {
            if (reactFlowInstance) {
                // Debounced fit view on window resize
                setTimeout(() => {
                    applyFitView()
                }, 150)
            }
        }

        let resizeTimeout: NodeJS.Timeout
        const debouncedResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(handleResize, 300)
        }

        window.addEventListener('resize', debouncedResize)
        return () => {
            window.removeEventListener('resize', debouncedResize)
            clearTimeout(resizeTimeout)
        }
    }, [applyFitView])

    return {
        reactFlowInstance,
        setReactFlowInstance,
        layoutState,
        setLayoutState,
        processNodes,
        processEdgesWithTheme,
        applyFitView,
        onNodesChangeWithBoundaryUpdate,
    }
}
