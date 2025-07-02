import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
    ReactFlow,
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ConnectionMode,
    BackgroundVariant,
    ReactFlowInstance,
    useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import ELK from 'elkjs/lib/elk.bundled.js'

// Using ELK Layered as the single layout algorithm

interface SimilarityResponse {
    timestamp: string
    total_file_pairs_with_similarity: number
    layout_used: string
    file_pairs: FilePair[]
}

interface FilePair {
    file_pair: {
        calculator_file: string
        game_file: string
    }
    react_flow: {
        nodes: Node[]
        edges: Edge[]
        has_similarity: boolean
        shared_blocks_count: number
        average_similarity: number
        flow_type: string
        layout_type: string
        layout_config: {
            file1_offset: { x: number; y: number }
            file2_offset: { x: number; y: number }
            node_separation: number
            rank_separation: number
            dagre_direction: string
            description: string
            auto_layout: boolean
        }
        files: {
            file1: string
            file2: string
        }
        layout_libraries?: {
            dagre_integration: {
                library: string
                install: string
                usage: string
                recommended_settings: Record<string, any>
            }
            elk_integration: {
                library: string
                install: string
                usage: string
                recommended_settings: Record<string, any>
            }
        }
    }
}

const SimilarityTestPage: React.FC = () => {
    const [data, setData] = useState<SimilarityResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0)
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
    const [isApplyingLayout, setIsApplyingLayout] = useState<boolean>(false)
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
    const [isApplyingZoom, setIsApplyingZoom] = useState<boolean>(false)

    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    // Handle node changes and recalculate boundaries for file containers
    const onNodesChangeWithBoundaryUpdate = useCallback(
        (changes: any[]) => {
            onNodesChange(changes)
            
            // Recalculate boundaries after node position changes
            const hasPositionChanges = changes.some(change => change.type === 'position')
            if (hasPositionChanges) {
                // Debounce boundary recalculation to avoid excessive updates
                setTimeout(() => {
                    setNodes(currentNodes => {
                        const boundaries = calculateSubflowBoundaries(currentNodes)
                        let updatedNodes = currentNodes.map(node => {
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
                                        }
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
        [onNodesChange, setNodes]
    )

    // ELK Layered Layout function
    const applyELKLayout = async (nodes: Node[], edges: Edge[]): Promise<Node[]> => {
        console.log('🎯 Applying ELK Layered layout...')
        
        const elk = new ELK()
        
        // Separate file containers from child nodes
        const fileContainers = nodes.filter(n => n.data?.type === 'file_subflow')
        const childNodes = nodes.filter(n => n.parentNode)
        const standaloneNodes = nodes.filter(n => !n.parentNode && n.data?.type !== 'file_subflow')
        
        // ELK Layered layout options
        const layoutOptions = {
            'elk.padding': '[top=50,left=50,bottom=50,right=50]',
            'elk.spacing.nodeNode': '100',
            'elk.spacing.componentComponent': '80',
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.layered.spacing.nodeNodeBetweenLayers': '150',
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        }
        
        // First pass: calculate initial container sizes based on current child positions
        const initialBoundaries = calculateSubflowBoundaries(nodes)
        
        // Create ELK graph structure with dynamic container sizing
        const elkGraph = {
            id: 'root',
            layoutOptions: layoutOptions,
            children: [
                ...fileContainers.map(fileNode => {
                    const bounds = initialBoundaries.get(fileNode.id) || { width: 600, height: 500 }
                    return {
                        id: fileNode.id,
                        width: bounds.width,
                        height: bounds.height,
                        layoutOptions: {
                            'elk.algorithm': 'layered',
                            'elk.direction': 'DOWN',
                            'elk.spacing.nodeNode': '60',
                            'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                            'elk.padding': '[top=60,left=30,bottom=30,right=30]'
                        },
                        children: childNodes
                            .filter(child => child.parentNode === fileNode.id)
                            .map(child => ({
                                id: child.id,
                                width: parseFloat(child.style?.width?.toString() || '180'),
                                height: parseFloat(child.style?.height?.toString() || '50'),
                            }))
                    }
                }),
                ...standaloneNodes.map(node => ({
                    id: node.id,
                    width: parseFloat(node.style?.width?.toString() || '200'),
                    height: parseFloat(node.style?.height?.toString() || '80'),
                }))
            ],
            edges: edges.map(edge => ({
                id: edge.id,
                sources: [edge.source],
                targets: [edge.target],
            }))
        }
        
        console.log('📊 ELK Layered graph structure:', elkGraph)
        
        try {
            const layoutedGraph = await elk.layout(elkGraph)
            console.log('✅ ELK Layered layout completed:', layoutedGraph)
            
            // Apply the layout results back to nodes
            let layoutedNodes = nodes.map(node => {
                const elkNode = findELKNode(layoutedGraph, node.id)
                if (elkNode) {
                    return {
                        ...node,
                        position: {
                            x: elkNode.x || 0,
                            y: elkNode.y || 0,
                        },
                    }
                }
                return node
            })
            
            // Recalculate subflow boundaries after layout and adjust container sizes
            const finalBoundaries = calculateSubflowBoundaries(layoutedNodes)
            layoutedNodes = layoutedNodes.map(node => {
                if (node.data?.type === 'file_subflow') {
                    const bounds = finalBoundaries.get(node.id)
                    if (bounds) {
                        return {
                            ...node,
                            style: {
                                ...node.style,
                                width: `${bounds.width}px`,
                                height: `${bounds.height}px`,
                                minWidth: `${bounds.width}px`,
                                minHeight: `${bounds.height}px`,
                            }
                        }
                    }
                }
                return node
            })
            
            // Adjust child positions to be relative to their containers
            layoutedNodes = adjustChildPositions(layoutedNodes, finalBoundaries)
            
            console.log(`🎯 Applied ELK Layered layout to ${layoutedNodes.length} nodes with dynamic boundaries`)
            return layoutedNodes
            
        } catch (error) {
            console.error('❌ ELK Layered layout failed:', error)
            return nodes // Return original nodes if layout fails
        }
    }



    // Helper function to calculate subflow boundaries based on child positions
    const calculateSubflowBoundaries = (nodes: Node[]): Map<string, {width: number, height: number, minX: number, minY: number}> => {
        const boundaries = new Map<string, {width: number, height: number, minX: number, minY: number}>()
        
        // Get all file containers
        const fileContainers = nodes.filter(n => n.data?.type === 'file_subflow')
        
        fileContainers.forEach(container => {
            // Find all children of this container
            const children = nodes.filter(n => n.parentNode === container.id)
            
            if (children.length === 0) {
                // No children, use minimum size
                boundaries.set(container.id, {
                    width: 400,
                    height: 300,
                    minX: 0,
                    minY: 0
                })
                return
            }
            
            // Calculate bounding box of all children
            let minX = Infinity, maxX = -Infinity
            let minY = Infinity, maxY = -Infinity
            
            children.forEach(child => {
                const x = child.position?.x || 0
                const y = child.position?.y || 0
                const width = parseFloat(child.style?.width?.toString() || '180')
                const height = parseFloat(child.style?.height?.toString() || '50')
                
                minX = Math.min(minX, x)
                maxX = Math.max(maxX, x + width)
                minY = Math.min(minY, y)
                maxY = Math.max(maxY, y + height)
            })
            
            // Handle case where all children might be at 0,0 or negative positions
            if (minX === Infinity) {
                minX = 0
                maxX = 180
                minY = 0
                maxY = 50
            }
            
            // Add padding around children
            const padding = 60
            const calculatedWidth = Math.max(400, (maxX - minX) + (padding * 2))
            const calculatedHeight = Math.max(300, (maxY - minY) + (padding * 2))
            
            boundaries.set(container.id, {
                width: calculatedWidth,
                height: calculatedHeight,
                minX: minX - padding,
                minY: minY - padding
            })
            
            console.log(`📐 Calculated boundaries for ${container.id}:`, {
                width: calculatedWidth,
                height: calculatedHeight,
                childrenCount: children.length,
                bounds: { minX, maxX, minY, maxY }
            })
        })
        
        return boundaries
    }

    // Helper function to adjust child positions relative to container boundaries
    const adjustChildPositions = (nodes: Node[], boundaries: Map<string, any>): Node[] => {
        return nodes.map(node => {
            if (node.parentNode) {
                const containerBounds = boundaries.get(node.parentNode)
                if (containerBounds) {
                    // Adjust child position to be relative to container's adjusted bounds
                    return {
                        ...node,
                        position: {
                            x: (node.position?.x || 0) - containerBounds.minX,
                            y: (node.position?.y || 0) - containerBounds.minY
                        }
                    }
                }
            }
            return node
        })
    }

    // Calculate optimal zoom level based on content bounds
    const calculateOptimalZoom = (nodes: Node[]): { zoom: number, center: { x: number, y: number } } => {
        if (!nodes || nodes.length === 0) {
            return { zoom: 1, center: { x: 0, y: 0 } }
        }

        console.log('🔍 Calculating optimal zoom for', nodes.length, 'nodes')

        // Calculate bounding box of all nodes
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity

        nodes.forEach(node => {
            const x = node.position?.x || 0
            const y = node.position?.y || 0
            
            // More accurate dimension calculation
            let width: number, height: number
            if (node.data?.type === 'file_subflow') {
                // Use actual calculated dimensions for file containers
                width = parseFloat(node.style?.width?.toString().replace('px', '') || '600')
                height = parseFloat(node.style?.height?.toString().replace('px', '') || '500')
            } else {
                // Use default or calculated dimensions for other nodes
                width = parseFloat(node.style?.width?.toString().replace('px', '') || '180')
                height = parseFloat(node.style?.height?.toString().replace('px', '') || '50')
            }

            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x + width)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y + height)
        })

        // Handle edge case
        if (minX === Infinity) {
            return { zoom: 1, center: { x: 0, y: 0 } }
        }

        // Calculate content dimensions
        const contentWidth = maxX - minX
        const contentHeight = maxY - minY
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Get viewport dimensions (approximated)
        const viewportWidth = sidebarCollapsed ? window.innerWidth - 64 : window.innerWidth - 320
        const viewportHeight = window.innerHeight - 120 // Account for header

        // Calculate zoom to fit content with padding
        const padding = 100
        const zoomX = (viewportWidth - padding * 2) / contentWidth
        const zoomY = (viewportHeight - padding * 2) / contentHeight
        
        // Use the smaller zoom to ensure everything fits
        const optimalZoom = Math.min(zoomX, zoomY)
        
        // Clamp zoom between reasonable bounds
        const clampedZoom = Math.max(0.1, Math.min(optimalZoom, 1.5))

        console.log('📐 Content bounds:', {
            contentWidth: Math.round(contentWidth),
            contentHeight: Math.round(contentHeight),
            center: { x: Math.round(centerX), y: Math.round(centerY) },
            viewportWidth,
            viewportHeight,
            calculatedZoom: optimalZoom.toFixed(2),
            finalZoom: clampedZoom.toFixed(2)
        })

        return { 
            zoom: clampedZoom, 
            center: { x: centerX, y: centerY } 
        }
    }

    // Apply dynamic zoom and center to the flow
    const applyDynamicZoom = useCallback((nodes: Node[]) => {
        if (!reactFlowInstance || !nodes || nodes.length === 0) {
            console.log('⚠️ Cannot apply dynamic zoom: missing instance or nodes')
            return
        }

        setIsApplyingZoom(true)
        const { zoom, center } = calculateOptimalZoom(nodes)
        
        console.log('🎯 Applying dynamic zoom:', { zoom: zoom.toFixed(2), center })
        
        // Apply the calculated zoom and center
        requestAnimationFrame(() => {
            reactFlowInstance.setViewport({
                x: -center.x * zoom + (sidebarCollapsed ? window.innerWidth - 64 : window.innerWidth - 320) / 2,
                y: -center.y * zoom + (window.innerHeight - 120) / 2,
                zoom: zoom
            })
            
            // Clear zoom applying state after animation
            setTimeout(() => {
                setIsApplyingZoom(false)
            }, 300)
        })
    }, [reactFlowInstance, sidebarCollapsed])

    // Helper function to find a node in the ELK result
    const findELKNode = (elkGraph: any, nodeId: string): any => {
        if (elkGraph.id === nodeId) {
            return elkGraph
        }
        
        if (elkGraph.children) {
            for (const child of elkGraph.children) {
                const found = findELKNode(child, nodeId)
                if (found) {
                    // If this is a child node, add parent's position offset
                    if (found.id !== child.id) {
                        return {
                            ...found,
                            x: (found.x || 0) + (child.x || 0),
                            y: (found.y || 0) + (child.y || 0),
                        }
                    }
                    return found
                }
            }
        }
        
        return null
    }

    // Process edges to fix duplicate keys and invalid types
    const processEdges = (rawEdges: Edge[]): Edge[] => {
        console.log('🔧 Processing edges to fix duplicate keys and types...')
        const processedEdges: Edge[] = []
        const seenKeys = new Set<string>()

        rawEdges.forEach((edge, index) => {
            let newEdge = { ...edge }

            // Fix edge type - replace "bezier" with "default" or "smoothstep"
            if (newEdge.type === 'bezier') {
                newEdge.type = 'smoothstep' // Use smoothstep for better curved edges
                console.log(
                    `🔄 Fixed edge type from 'bezier' to 'smoothstep' for edge: ${edge.id}`
                )
            }

            // Ensure unique keys
            let edgeKey = newEdge.id
            let counter = 1
            while (seenKeys.has(edgeKey)) {
                edgeKey = `${newEdge.id}_${counter}`
                counter++
            }

            if (edgeKey !== newEdge.id) {
                console.log(
                    `🔄 Fixed duplicate edge key: ${newEdge.id} -> ${edgeKey}`
                )
                newEdge.id = edgeKey
            }

            // Ensure edges are visible above subflow containers
            if (newEdge.style) {
                newEdge.style = {
                    ...newEdge.style,
                    zIndex: 1000, // High z-index to appear above containers
                }
            } else {
                newEdge.style = {
                    zIndex: 1000,
                }
            }

            // Add special styling for similarity edges to make them more prominent
            if (newEdge.data?.type === 'similarity') {
                newEdge.style = {
                    ...newEdge.style,
                    strokeWidth: 4,
                    zIndex: 1001, // Even higher for similarity edges
                }
            }

            seenKeys.add(edgeKey)
            processedEdges.push(newEdge)
        })

        console.log(
            `✅ Processed ${rawEdges.length} edges, fixed ${rawEdges.length - processedEdges.length} duplicates`
        )
        return processedEdges
    }

    // Process nodes with ELK Layered layout
    const processNodes = async (rawNodes: Node[], rawEdges: Edge[] = []): Promise<Node[]> => {
        console.log('🔧 Processing nodes with ELK Layered layout...')
        if (!rawNodes || rawNodes.length === 0) {
            return rawNodes
        }

        setIsApplyingLayout(true)

        // First apply basic styling and z-index to nodes
        const styledNodes = rawNodes.map((node) => {
            const newNode = { ...node }

            if (node.data?.type === 'file_subflow') {
                // File container styling - remove fixed dimensions, they'll be calculated dynamically
                if (newNode.style) {
                    newNode.style = {
                        ...newNode.style,
                        zIndex: -1, // Behind edges
                    }
                } else {
                    newNode.style = {
                        zIndex: -1, // Behind edges
                    }
                }
            } else if (node.parentNode) {
                // Child node styling
                if (!newNode.style?.width) {
                    newNode.style = {
                        ...newNode.style,
                        minWidth: '180px',
                        minHeight: '50px',
                        zIndex: 1, // Above containers
                    }
                }
            }

            return newNode
        })

        // Apply ELK Layered layout algorithm
        try {
            const layoutedNodes = await applyELKLayout(styledNodes, rawEdges)

            console.log(`✅ ELK Layered layout applied to ${layoutedNodes.length} nodes with dynamic boundaries`)
            
            // Apply dynamic zoom after layout is complete
            setTimeout(() => {
                applyDynamicZoom(layoutedNodes)
            }, 100) // Small delay to ensure nodes are rendered
            
            return layoutedNodes
        } catch (error) {
            console.error('❌ ELK Layered layout failed, falling back to styled nodes:', error)
            return styledNodes
        } finally {
            setIsApplyingLayout(false)
        }
    }

    // Handle sidebar toggle zoom adjustment
    useEffect(() => {
        if (nodes.length > 0) {
            // Reapply dynamic zoom when sidebar is toggled
            setTimeout(() => {
                applyDynamicZoom(nodes)
            }, 300) // Delay to allow sidebar animation to complete
        }
    }, [sidebarCollapsed, applyDynamicZoom, nodes])

    // Handle window resize to reapply dynamic zoom
    useEffect(() => {
        const handleResize = () => {
            if (nodes.length > 0) {
                // Debounced zoom reapplication on window resize
                setTimeout(() => {
                    applyDynamicZoom(nodes)
                }, 150)
            }
        }

        let resizeTimeout: NodeJS.Timeout
        const debouncedResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(handleResize, 250) // 250ms debounce
        }

        window.addEventListener('resize', debouncedResize)
        return () => {
            window.removeEventListener('resize', debouncedResize)
            clearTimeout(resizeTimeout)
        }
    }, [nodes, applyDynamicZoom])



    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('🚀 Starting data fetch...')
                setLoading(true)

                console.log(
                    '📡 Making API request to:',
                    'http://localhost:3002/detection/react-flow-ast/projects'
                )
                const response = await fetch(
                    'http://localhost:3002/detection/react-flow-ast/projects'
                )

                console.log('📥 Response received:', {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                console.log('🔄 Parsing JSON response...')
                const result: SimilarityResponse = await response.json()

                console.log('✅ JSON parsed successfully:', {
                    timestamp: result.timestamp,
                    layout_used: result.layout_used,
                    total_file_pairs: result.file_pairs?.length,
                    total_file_pairs_with_similarity:
                        result.total_file_pairs_with_similarity,
                })

                console.log('📊 Full response data:', result)

                console.log('🔧 Setting data state...')
                setData(result)

                // Initialize with first file pair if available
                if (result.file_pairs && result.file_pairs.length > 0) {
                    console.log('🎯 Initializing with first file pair...')
                    const firstPair = result.file_pairs[0]

                    console.log('📁 First pair info:', {
                        calculator_file: firstPair.file_pair?.calculator_file,
                        game_file: firstPair.file_pair?.game_file,
                        nodes_count: firstPair.react_flow?.nodes?.length,
                        edges_count: firstPair.react_flow?.edges?.length,
                        has_similarity: firstPair.react_flow?.has_similarity,
                    })

                    console.log('🔗 Setting nodes and edges...')
                    const processedNodes = await processNodes(
                        firstPair.react_flow.nodes || [],
                        firstPair.react_flow.edges || []
                    )
                    setNodes(processedNodes)

                    // Process edges before setting them
                    const processedEdges = processEdges(
                        firstPair.react_flow.edges || []
                    )
                    setEdges(processedEdges)
                    
                    // Apply dynamic zoom for initial load
                    setTimeout(() => {
                        applyDynamicZoom(processedNodes)
                    }, 200) // Longer delay for initial load
                    
                    console.log('✅ Nodes and edges set successfully')
                } else {
                    console.log('⚠️ No file pairs found in response')
                    setNodes([])
                    setEdges([])
                }
            } catch (err) {
                console.error('❌ Error in fetchData:', err)
                console.error('📍 Error details:', {
                    name: err instanceof Error ? err.name : 'Unknown',
                    message:
                        err instanceof Error ? err.message : 'Unknown error',
                    stack: err instanceof Error ? err.stack : undefined,
                })
                setError(
                    err instanceof Error
                        ? err.message
                        : 'An unknown error occurred'
                )
            } finally {
                console.log('🏁 Setting loading to false')
                setLoading(false)
            }
        }

        console.log('🎬 useEffect triggered, calling fetchData')
        fetchData()
    }, [])

    const handlePairChange = (index: number) => {
        console.log('🔄 Changing to pair index:', index)
        if (data && data.file_pairs[index]) {
            console.log('✅ Valid pair found, updating state...')
            setSelectedPairIndex(index)
            const selectedPair = data.file_pairs[index]

            console.log('📊 Selected pair info:', {
                calculator_file: selectedPair.file_pair?.calculator_file,
                game_file: selectedPair.file_pair?.game_file,
                nodes_count: selectedPair.react_flow?.nodes?.length,
                edges_count: selectedPair.react_flow?.edges?.length,
            })

            processNodes(
                selectedPair.react_flow.nodes || [],
                selectedPair.react_flow.edges || []
            ).then((processedNodes) => {
                setNodes(processedNodes)
                // Process edges before setting them
                const processedEdges = processEdges(
                    selectedPair.react_flow.edges || []
                )
                setEdges(processedEdges)
                
                // Apply dynamic zoom for the new pair
                setTimeout(() => {
                    applyDynamicZoom(processedNodes)
                }, 150) // Slightly longer delay for pair changes
                
                console.log('✅ Pair change completed')
            })
        } else {
            console.log('❌ Invalid pair index or no data available')
        }
    }

    const getSimilarityColor = (score: number) => {
        if (score >= 0.8) return 'text-red-600 bg-red-50 border-red-200'
        if (score >= 0.6)
            return 'text-orange-600 bg-orange-50 border-orange-200'
        if (score >= 0.4)
            return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-green-600 bg-green-50 border-green-200'
    }

    const getNodeStats = (nodes: Node[]) => {
        console.log('📊 Calculating node stats for nodes:', nodes?.length || 0)
        if (!nodes || !Array.isArray(nodes)) {
            console.log('⚠️ Invalid nodes array provided to getNodeStats')
            return {
                fileNodes: 0,
                functionNodes: 0,
                importGroups: 0,
                similarityComments: 0,
                similarFunctions: 0,
                fileSubflows: 0,
            }
        }

        const fileNodes = nodes.filter(
            (node) => node.data?.type === 'file'
        ).length
        const fileSubflows = nodes.filter(
            (node) => node.data?.type === 'file_subflow'
        ).length
        const functionNodes = nodes.filter(
            (node) => node.data?.type === 'function'
        ).length
        const importGroups = nodes.filter(
            (node) => node.data?.type === 'import_group'
        ).length
        const similarityComments = nodes.filter(
            (node) => node.data?.type === 'similarity_comment'
        ).length
        const similarFunctions = nodes.filter(
            (node) =>
                node.data?.type === 'function' && node.data?.has_similarity
        ).length

        const stats = {
            fileNodes,
            fileSubflows,
            functionNodes,
            importGroups,
            similarityComments,
            similarFunctions,
        }
        console.log('📈 Node stats calculated:', stats)
        return stats
    }

    const getEdgeStats = (edges: Edge[]) => {
        console.log('🔗 Calculating edge stats for edges:', edges?.length || 0)
        if (!edges || !Array.isArray(edges)) {
            console.log('⚠️ Invalid edges array provided to getEdgeStats')
            return {
                structureEdges: 0,
                similarityEdges: 0,
                functionCallEdges: 0,
                animatedEdges: 0,
            }
        }

        const structureEdges = edges.filter(
            (edge) => !edge.data?.type || edge.data.type === 'structure'
        ).length
        const similarityEdges = edges.filter(
            (edge) => edge.data?.type === 'similarity'
        ).length
        const functionCallEdges = edges.filter(
            (edge) => edge.data?.type === 'function_call'
        ).length
        const animatedEdges = edges.filter((edge) => edge.animated).length

        const stats = {
            structureEdges,
            similarityEdges,
            functionCallEdges,
            animatedEdges,
        }
        console.log('🔗 Edge stats calculated:', stats)
        return stats
    }

    const getLayoutInfo = (layoutConfig: any) => {
        console.log('⚙️ Processing layout config:', layoutConfig)
        if (!layoutConfig) {
            console.log('⚠️ No layout config provided')
            return {
                direction: 'TB',
                nodesSeparation: 100,
                rankSeparation: 150,
                autoLayout: false,
                description: 'No description',
            }
        }

        const info = {
            direction: layoutConfig.dagre_direction || 'TB',
            nodesSeparation: layoutConfig.node_separation || 100,
            rankSeparation: layoutConfig.rank_separation || 150,
            autoLayout: layoutConfig.auto_layout || false,
            description: layoutConfig.description || 'No description',
        }
        console.log('⚙️ Layout info processed:', info)
        return info
    }



    console.log('🎭 Component render state:', {
        loading,
        error,
        hasData: !!data,
        selectedPairIndex,
        dataFilePairsLength: data?.file_pairs?.length,
        sidebarCollapsed,
    })

    if (loading) {
        console.log('⏳ Rendering loading state')
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-700">
                        Loading AST similarity data...
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                        Preparing Dagre layout visualization
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Check browser console for debug logs
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        console.log('❌ Rendering error state:', error)
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-red-200">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                        Connection Error
                    </div>
                    <div className="text-red-600 mb-4">{error}</div>
                    <div className="text-xs text-gray-500 mb-4">
                        Check browser console for detailed logs
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!data || !data.file_pairs || data.file_pairs.length === 0) {
        console.log('📭 Rendering empty data state')
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                        No Data Available
                    </div>
                    <div className="text-gray-600">
                        No similarity data found
                    </div>
                </div>
            </div>
        )
    }

    console.log('🎨 Rendering main component')
    const currentPair = data.file_pairs[selectedPairIndex]
    console.log('📍 Current pair:', {
        index: selectedPairIndex,
        exists: !!currentPair,
        calculator_file: currentPair?.file_pair?.calculator_file,
        game_file: currentPair?.file_pair?.game_file,
    })

    if (!currentPair) {
        console.log('❌ Current pair is null/undefined')
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-yellow-200">
                    <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                        Invalid Data State
                    </div>
                    <div className="text-gray-600">
                        Selected pair index is invalid
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        Check browser console for debug info
                    </div>
                </div>
            </div>
        )
    }

    const nodeStats = getNodeStats(currentPair.react_flow?.nodes)
    const edgeStats = getEdgeStats(currentPair.react_flow?.edges)
    const layoutInfo = getLayoutInfo(currentPair.react_flow?.layout_config)

    return (
        <div className="h-[calc(100vh_-_100px)] flex bg-gray-100">
            {/* Sidebar */}
            <div
                className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
                    sidebarCollapsed ? 'w-16' : 'w-80'
                } flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                AST Similarity
                            </h1>
                            <p className="text-sm text-gray-500">
                                Analysis Dashboard (
                                {data.layout_used.toUpperCase()})
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                        </svg>
                    </button>
                </div>

                {!sidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto">
                        {/* Overview Stats */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Overview
                            </h2>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Total Pairs
                                    </span>
                                    <span className="font-medium">
                                        {data.file_pairs.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        With Similarity
                                    </span>
                                    <span className="font-medium">
                                        {data.total_file_pairs_with_similarity}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Layout Engine
                                    </span>
                                    <span className="font-medium capitalize">
                                        {data.layout_used}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Timestamp
                                    </span>
                                    <span className="font-medium text-xs">
                                        {new Date(
                                            data.timestamp
                                        ).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* File Pair Selector */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                File Pairs
                            </h2>
                            <select
                                value={selectedPairIndex}
                                onChange={(e) =>
                                    handlePairChange(parseInt(e.target.value))
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {data.file_pairs.map((pair, index) => (
                                    <option key={index} value={index}>
                                        {pair.file_pair.calculator_file} ↔{' '}
                                        {pair.file_pair.game_file}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Current Pair Info */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Current Comparison
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">
                                        File 1
                                    </div>
                                    <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                        📁 {currentPair.react_flow.files.file1}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">
                                        File 2
                                    </div>
                                    <div className="bg-green-50 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                        📁 {currentPair.react_flow.files.file2}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout Configuration */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Layout Configuration
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Direction
                                    </span>
                                    <span className="font-medium">
                                        {layoutInfo.direction}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Node Sep
                                    </span>
                                    <span className="font-medium">
                                        {layoutInfo.nodesSeparation}px
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Rank Sep
                                    </span>
                                    <span className="font-medium">
                                        {layoutInfo.rankSeparation}px
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Original Auto Layout
                                    </span>
                                    <span
                                        className={`font-medium ${layoutInfo.autoLayout ? 'text-green-600' : 'text-gray-600'}`}
                                    >
                                        {layoutInfo.autoLayout ? '✓' : '✗'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Similarity Metrics */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Similarity Metrics
                            </h2>
                            <div className="space-y-3">
                                <div
                                    className={`p-3 rounded-lg border ${
                                        currentPair.react_flow.has_similarity
                                            ? getSimilarityColor(
                                                  currentPair.react_flow
                                                      .average_similarity
                                              )
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium">
                                            Average Similarity
                                        </span>
                                        <span className="text-lg font-bold">
                                            {currentPair.react_flow
                                                .has_similarity
                                                ? `${(currentPair.react_flow.average_similarity * 100).toFixed(1)}%`
                                                : 'None'}
                                        </span>
                                    </div>
                                    {currentPair.react_flow.has_similarity && (
                                        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-current opacity-70"
                                                style={{
                                                    width: `${currentPair.react_flow.average_similarity * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-gray-600">
                                            Shared Blocks
                                        </span>
                                        <span className="font-semibold">
                                            {
                                                currentPair.react_flow
                                                    .shared_blocks_count
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Node Statistics */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Graph Statistics
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📁 File Containers
                                    </span>
                                    <span className="font-medium">
                                        {nodeStats.fileSubflows}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📄 Legacy Files
                                    </span>
                                    <span className="font-medium">
                                        {nodeStats.fileNodes}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📦 Import Groups
                                    </span>
                                    <span className="font-medium">
                                        {nodeStats.importGroups}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ⚙️ Functions
                                    </span>
                                    <span className="font-medium">
                                        {nodeStats.functionNodes}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ⚡ Similar Functions
                                    </span>
                                    <span className="font-medium text-red-600">
                                        {nodeStats.similarFunctions}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        💭 Comments
                                    </span>
                                    <span className="font-medium">
                                        {nodeStats.similarityComments}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Edge Statistics */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Edge Statistics
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        🔗 Structure
                                    </span>
                                    <span className="font-medium">
                                        {edgeStats.structureEdges}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        🎯 Function Calls
                                    </span>
                                    <span className="font-medium text-blue-600">
                                        {edgeStats.functionCallEdges}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ⚡ Similarities
                                    </span>
                                    <span className="font-medium text-red-600">
                                        {edgeStats.similarityEdges}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ✨ Animated
                                    </span>
                                    <span className="font-medium">
                                        {edgeStats.animatedEdges}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📊 Total
                                    </span>
                                    <span className="font-medium">
                                        {currentPair.react_flow.edges.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Layout Performance */}
                        <div className="p-4">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Layout Performance
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        🚀 Algorithm
                                    </span>
                                    <span className="font-medium">
                                        📊 ELK Layered
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📐 Node Dragging
                                    </span>
                                    <span className="font-medium text-green-600">
                                        ✓ Enabled
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ⏱️ Processing
                                    </span>
                                    <span className={`font-medium ${isApplyingLayout ? 'text-orange-600' : 'text-green-600'}`}>
                                        {isApplyingLayout ? '⚡ Active' : '✓ Ready'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        🔍 Current Zoom
                                    </span>
                                    <span className="font-medium text-blue-600">
                                        {reactFlowInstance ? `${(reactFlowInstance.getZoom() * 100).toFixed(0)}%` : '---'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Zoom Controls */}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <h3 className="text-xs font-semibold text-blue-900 mb-2">🔍 Zoom Controls</h3>
                                <button
                                    onClick={() => applyDynamicZoom(nodes)}
                                    disabled={!reactFlowInstance || nodes.length === 0 || isApplyingZoom}
                                    className="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                    {isApplyingZoom ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                            Applying Zoom...
                                        </>
                                    ) : (
                                        <>🎯 Reset to Optimal Zoom</>
                                    )}
                                </button>
                                <p className="text-xs text-blue-700 mt-1">
                                    Automatically fits content to viewport
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-lg font-semibold text-gray-900">
                                Code Structure Visualization
                            </h1>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>•</span>
                                <span>
                                    {currentPair.react_flow.files.file1} vs{' '}
                                    {currentPair.react_flow.files.file2}
                                </span>
                                <span>•</span>
                                <span>{currentPair.react_flow.flow_type}</span>
                                {isApplyingZoom && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1 text-blue-600">
                                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                                            <span className="text-xs">Optimizing Zoom...</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Legend */}
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
                                    <span className="text-gray-600">Files</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div>
                                    <span className="text-gray-600">Imports</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-orange-100 border border-orange-500 rounded"></div>
                                    <span className="text-gray-600">Functions</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded"></div>
                                    <span className="text-gray-600">Similar</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded border-dashed"></div>
                                    <span className="text-gray-600">Calls</span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs">
                                    <div className="w-3 h-3 bg-purple-100 border border-purple-500 rounded border-dashed"></div>
                                    <span className="text-gray-600">Comments</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* React Flow Container */}
                <div className="flex-1 bg-gray-50">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChangeWithBoundaryUpdate}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        connectionMode={ConnectionMode.Loose}
                        fitView={false}
                        minZoom={0.1}
                        maxZoom={1.5}
                        nodesDraggable={true}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        attributionPosition="bottom-left"
                        className="bg-gray-50"
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
                            color="#e5e7eb"
                        />
                    </ReactFlow>
                </div>
            </div>
        </div>
    )
}

export default SimilarityTestPage
 