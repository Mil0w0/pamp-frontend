import { useState, useCallback, useEffect, useRef } from 'react'
import { Node, Edge, ReactFlowInstance, NodeChange } from 'reactflow'
import { useTheme } from '@/components/ui/theme-provider'
import { 
    applyELKLayout, 
    calculateSubflowBoundaries, 
    adjustChildPositions, 
    processEdges, 
    getNodeStyling, 
    calculateOptimalZoom 
} from '../utils'
import { LayoutState } from '../types'

interface UseReactFlowLayoutProps {
    sidebarCollapsed: boolean
}

export const useReactFlowLayout = ({ sidebarCollapsed }: UseReactFlowLayoutProps) => {
    const { theme } = useTheme()
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
    const [layoutState, setLayoutState] = useState<LayoutState>({
        isApplyingLayout: false,
        isApplyingZoom: false,
        isTransitioning: false,
    })

    // Refs to prevent circular dependencies and track zoom state
    const isZoomingRef = useRef<boolean>(false)
    const lastZoomAppliedRef = useRef<number>(0)
    const sidebarCollapsedRef = useRef<boolean>(sidebarCollapsed)
    
    // Update sidebar ref when it changes
    sidebarCollapsedRef.current = sidebarCollapsed

    // Reset zoom state when ReactFlow instance changes
    useEffect(() => {
        isZoomingRef.current = false
        lastZoomAppliedRef.current = 0
    }, [reactFlowInstance])

    // Apply dynamic zoom and center to the flow
    const applyDynamicZoom = useCallback(
        (nodes: Node[]) => {
            if (!reactFlowInstance || !nodes || nodes.length === 0) {
                console.log('Cannot apply dynamic zoom: missing instance or nodes')
                return
            }

            // Prevent multiple simultaneous zoom operations
            if (isZoomingRef.current) {
                console.log('Zoom already in progress, skipping...')
                return
            }

            const now = Date.now()
            // Throttle zoom applications to prevent rapid successive calls
            if (now - lastZoomAppliedRef.current < 500) {
                console.log('Zoom throttled, too soon since last application')
                return
            }

            isZoomingRef.current = true
            lastZoomAppliedRef.current = now
            setLayoutState(prev => ({ ...prev, isApplyingZoom: true }))
            
            const { zoom, center } = calculateOptimalZoom(nodes, sidebarCollapsedRef.current)

            console.log('Applying dynamic zoom:', {
                zoom: zoom.toFixed(2),
                center,
            })

            // Apply the calculated zoom and center
            requestAnimationFrame(() => {
                if (reactFlowInstance) {
                    reactFlowInstance.setViewport({
                        x: -center.x * zoom + (sidebarCollapsedRef.current
                            ? window.innerWidth - 64
                            : window.innerWidth - 320) / 2,
                        y: -center.y * zoom + (window.innerHeight - 120) / 2,
                        zoom: zoom,
                    })
                }

                // Clear zoom applying state after animation
                setTimeout(() => {
                    isZoomingRef.current = false
                    setLayoutState(prev => ({ ...prev, isApplyingZoom: false }))
                }, 300)
            })
        },
        [reactFlowInstance] // Remove sidebarCollapsed dependency
    )

    // Process nodes with ELK Layered layout
    const processNodes = useCallback(async (
        rawNodes: Node[],
        rawEdges: Edge[] = []
    ): Promise<Node[]> => {
        console.log('Processing nodes with ELK Layered layout...')
        if (!rawNodes || rawNodes.length === 0) {
            return rawNodes
        }

        setLayoutState(prev => ({ ...prev, isApplyingLayout: true }))

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
            const layoutedNodes = await applyELKLayout(styledNodes, rawEdges)

            console.log(
                `ELK Layered layout applied to ${layoutedNodes.length} nodes with dynamic boundaries`
            )

            // Apply dynamic zoom after layout is complete
            setTimeout(() => {
                applyDynamicZoom(layoutedNodes)
            }, 100) // Small delay to ensure nodes are rendered

            return layoutedNodes
        } catch (error) {
            console.error(
                'ELK Layered layout failed, falling back to styled nodes:',
                error
            )
            return styledNodes
        } finally {
            setLayoutState(prev => ({ ...prev, isApplyingLayout: false }))
        }
    }, [theme, applyDynamicZoom]) // Use applyDynamicZoom which is stable now

    // Handle node changes and recalculate boundaries for file containers
    const onNodesChangeWithBoundaryUpdate = useCallback(
        (changes: NodeChange[], onNodesChange: (changes: NodeChange[]) => void, setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void) => {
            onNodesChange(changes)

            // Recalculate boundaries after node position changes
            const hasPositionChanges = changes.some(
                (change) => change.type === 'position'
            )
            if (hasPositionChanges) {
                // Debounce boundary recalculation to avoid excessive updates
                setTimeout(() => {
                    setNodes((currentNodes) => {
                        const boundaries = calculateSubflowBoundaries(currentNodes)
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
                        updatedNodes = adjustChildPositions(updatedNodes, boundaries)
                        return updatedNodes
                    })
                }, 100) // 100ms debounce
            }
        },
        []
    )

    // Process edges with theme-aware styling
    const processEdgesWithTheme = useCallback((rawEdges: Edge[]): Edge[] => {
        return processEdges(rawEdges, theme)
    }, [theme])

    // Handle sidebar toggle zoom adjustment
    useEffect(() => {
        // Only apply zoom if we have an instance and we're not currently zooming
        if (reactFlowInstance && !isZoomingRef.current) {
            // Small delay to allow sidebar animation to complete
            const timeoutId = setTimeout(() => {
                if (!isZoomingRef.current) {
                    const nodes = reactFlowInstance.getNodes()
                    if (nodes.length > 0) {
                        applyDynamicZoom(nodes)
                    }
                }
            }, 350) // Slightly longer delay

            return () => clearTimeout(timeoutId)
        }
    }, [sidebarCollapsed]) // Only depend on sidebarCollapsed

    // Handle window resize to reapply dynamic zoom
    useEffect(() => {
        const handleResize = () => {
            if (reactFlowInstance && !isZoomingRef.current) {
                const nodes = reactFlowInstance.getNodes()
                if (nodes.length > 0) {
                    // Debounced zoom reapplication on window resize
                    setTimeout(() => {
                        if (!isZoomingRef.current) {
                            applyDynamicZoom(nodes)
                        }
                    }, 150)
                }
            }
        }

        let resizeTimeout: NodeJS.Timeout
        const debouncedResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(handleResize, 300) // Longer debounce
        }

        window.addEventListener('resize', debouncedResize)
        return () => {
            window.removeEventListener('resize', debouncedResize)
            clearTimeout(resizeTimeout)
        }
    }, []) // No dependencies - use refs instead

    return {
        reactFlowInstance,
        setReactFlowInstance,
        layoutState,
        setLayoutState,
        processNodes,
        processEdgesWithTheme,
        applyDynamicZoom,
        onNodesChangeWithBoundaryUpdate,
    }
} 