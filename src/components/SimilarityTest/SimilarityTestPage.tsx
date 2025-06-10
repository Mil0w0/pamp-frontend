import React, { useEffect, useState, useCallback } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import ELK from 'elkjs/lib/elk.bundled.js'

// Layout algorithm types
type LayoutAlgorithm = 
    | 'elk-layered'
    | 'elk-force'
    | 'elk-stress' 
    | 'elk-radial'
    | 'elk-box'
    | 'dagre-tb'
    | 'dagre-lr'
    | 'dagre-bt'
    | 'dagre-rl'
    | 'force-directed'
    | 'circular'
    | 'hierarchical'
    | 'manual'

interface LayoutConfig {
    name: string
    description: string
    algorithm: LayoutAlgorithm
    icon: string
    color: string
}

const LAYOUT_ALGORITHMS: LayoutConfig[] = [
    {
        name: 'ELK Layered',
        description: 'Hierarchical layout with layers (recommended)',
        algorithm: 'elk-layered',
        icon: '📊',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
        name: 'ELK Force',
        description: 'Physics-based force-directed layout',
        algorithm: 'elk-force',
        icon: '⚡',
        color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
        name: 'ELK Stress',
        description: 'Stress minimization layout',
        algorithm: 'elk-stress',
        icon: '🎯',
        color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
        name: 'ELK Radial',
        description: 'Radial tree layout from center',
        algorithm: 'elk-radial',
        icon: '☀️',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    {
        name: 'ELK Box',
        description: 'Simple box packing layout',
        algorithm: 'elk-box',
        icon: '📦',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
        name: 'Dagre Top-Bottom',
        description: 'Traditional hierarchical (Dagre)',
        algorithm: 'dagre-tb',
        icon: '⬇️',
        color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    },
    {
        name: 'Dagre Left-Right',
        description: 'Horizontal hierarchical (Dagre)',
        algorithm: 'dagre-lr',
        icon: '➡️',
        color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
        name: 'Force Directed',
        description: 'Custom force simulation',
        algorithm: 'force-directed',
        icon: '🌀',
        color: 'text-pink-600 bg-pink-50 border-pink-200'
    },
    {
        name: 'Circular',
        description: 'Circular node arrangement',
        algorithm: 'circular',
        icon: '⭕',
        color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    {
        name: 'Manual',
        description: 'Manual positioning (draggable)',
        algorithm: 'manual',
        icon: '✋',
        color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
]

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
    const [selectedLayout, setSelectedLayout] = useState<LayoutAlgorithm>('elk-layered')
    const [isApplyingLayout, setIsApplyingLayout] = useState<boolean>(false)
    const [autoLayoutEnabled, setAutoLayoutEnabled] = useState<boolean>(true)

    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    // Enhanced ELK Layout function with multiple algorithms
    const applyELKLayout = async (
        nodes: Node[], 
        edges: Edge[], 
        algorithm: LayoutAlgorithm = 'elk-layered'
    ): Promise<Node[]> => {
        console.log(`🎯 Applying ${algorithm} layout...`)
        
        const elk = new ELK()
        
        // Separate file containers from child nodes
        const fileContainers = nodes.filter(n => n.data?.type === 'file_subflow')
        const childNodes = nodes.filter(n => n.parentNode)
        const standaloneNodes = nodes.filter(n => !n.parentNode && n.data?.type !== 'file_subflow')
        
        // Get layout options based on algorithm
        const getLayoutOptions = (alg: LayoutAlgorithm) => {
            const baseOptions = {
                'elk.padding': '[top=50,left=50,bottom=50,right=50]',
                'elk.spacing.nodeNode': '100',
                'elk.spacing.componentComponent': '80',
            }

            switch (alg) {
                case 'elk-layered':
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'layered',
                        'elk.direction': 'DOWN',
                        'elk.layered.spacing.nodeNodeBetweenLayers': '150',
                        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
                        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
                    }
                case 'elk-force':
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'force',
                        'elk.force.temperature': '0.001',
                        'elk.force.iterations': '300',
                        'elk.force.repulsivePower': '1',
                    }
                case 'elk-stress':
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'stress',
                        'elk.stress.iterations': '1000',
                        'elk.stress.epsilon': '0.0001',
                    }
                case 'elk-radial':
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'radial',
                        'elk.radial.radius': '100',
                        'elk.radial.compactor': 'NONE',
                    }
                case 'elk-box':
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'box',
                        'elk.box.packingMode': 'SIMPLE',
                    }
                default:
                    return {
                        ...baseOptions,
                        'elk.algorithm': 'layered',
                        'elk.direction': 'DOWN',
                    }
            }
        }
        
        // Create ELK graph structure
        const elkGraph = {
            id: 'root',
            layoutOptions: getLayoutOptions(algorithm),
            children: [
                ...fileContainers.map(fileNode => ({
                    id: fileNode.id,
                    width: 600,
                    height: 500,
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
                })),
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
        
        console.log(`📊 ${algorithm} graph structure:`, elkGraph)
        
        try {
            const layoutedGraph = await elk.layout(elkGraph)
            console.log(`✅ ${algorithm} layout completed:`, layoutedGraph)
            
            // Apply the layout results back to nodes
            const layoutedNodes = nodes.map(node => {
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
            
            console.log(`🎯 Applied ${algorithm} layout to ${layoutedNodes.length} nodes`)
            return layoutedNodes
            
        } catch (error) {
            console.error(`❌ ${algorithm} layout failed:`, error)
            return nodes // Return original nodes if layout fails
        }
    }

    // Custom layout algorithms
    const applyForceDirectedLayout = (nodes: Node[], edges: Edge[]): Node[] => {
        console.log('🌀 Applying Force Directed layout...')
        
        const center = { x: 400, y: 300 }
        const strength = 0.3
        const distance = 200
        
        return nodes.map((node, index) => {
            const angle = (index / nodes.length) * 2 * Math.PI
            const radius = distance + Math.random() * 100
            
            return {
                ...node,
                position: {
                    x: center.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
                    y: center.y + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
                },
            }
        })
    }

    const applyCircularLayout = (nodes: Node[], edges: Edge[]): Node[] => {
        console.log('⭕ Applying Circular layout...')
        
        const center = { x: 400, y: 300 }
        const outerRadius = 300
        const innerRadius = 150
        
        const fileContainers = nodes.filter(n => n.data?.type === 'file_subflow')
        const childNodes = nodes.filter(n => n.parentNode)
        const standaloneNodes = nodes.filter(n => !n.parentNode && n.data?.type !== 'file_subflow')
        
        return nodes.map((node, index) => {
            if (node.data?.type === 'file_subflow') {
                // File containers in outer circle
                const angle = (fileContainers.indexOf(node) / fileContainers.length) * 2 * Math.PI
                return {
                    ...node,
                    position: {
                        x: center.x + Math.cos(angle) * outerRadius,
                        y: center.y + Math.sin(angle) * outerRadius,
                    },
                }
            } else if (node.parentNode) {
                // Child nodes relative to their parent
                const parent = nodes.find(n => n.id === node.parentNode)
                if (parent) {
                    const siblings = childNodes.filter(n => n.parentNode === node.parentNode)
                    const siblingIndex = siblings.indexOf(node)
                    const angle = (siblingIndex / siblings.length) * 2 * Math.PI
                    const radius = 80
                    
                    return {
                        ...node,
                        position: {
                            x: radius * Math.cos(angle),
                            y: radius * Math.sin(angle),
                        },
                    }
                }
            } else {
                // Standalone nodes in inner circle
                const angle = (standaloneNodes.indexOf(node) / standaloneNodes.length) * 2 * Math.PI
                return {
                    ...node,
                    position: {
                        x: center.x + Math.cos(angle) * innerRadius,
                        y: center.y + Math.sin(angle) * innerRadius,
                    },
                }
            }
            
            return node
        })
    }

    const applyDagreLayout = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' | 'BT' | 'RL' = 'TB'): Node[] => {
        console.log(`⬇️ Applying Dagre ${direction} layout...`)
        
        // Simple Dagre-like layout implementation
        const layers: Node[][] = []
        const visited = new Set<string>()
        const nodeMap = new Map(nodes.map(n => [n.id, n]))
        
        // Group nodes by hierarchy level
        const assignLayers = (nodeId: string, layer: number) => {
            if (visited.has(nodeId)) return
            visited.add(nodeId)
            
            if (!layers[layer]) layers[layer] = []
            const node = nodeMap.get(nodeId)
            if (node) layers[layer].push(node)
            
            // Find children
            const childEdges = edges.filter(e => e.source === nodeId)
            childEdges.forEach(edge => {
                assignLayers(edge.target, layer + 1)
            })
        }
        
        // Start with root nodes (no incoming edges)
        const rootNodes = nodes.filter(node => 
            !edges.some(edge => edge.target === node.id)
        )
        
        rootNodes.forEach(node => assignLayers(node.id, 0))
        
        // Position nodes
        const layerSpacing = direction === 'LR' || direction === 'RL' ? 300 : 200
        const nodeSpacing = direction === 'TB' || direction === 'BT' ? 200 : 150
        
        return nodes.map(node => {
            const layerIndex = layers.findIndex(layer => layer.includes(node))
            const nodeIndex = layers[layerIndex]?.indexOf(node) || 0
            const layerSize = layers[layerIndex]?.length || 1
            
            let x, y
            
            switch (direction) {
                case 'LR':
                    x = layerIndex * layerSpacing + 100
                    y = (nodeIndex - (layerSize - 1) / 2) * nodeSpacing + 300
                    break
                case 'RL':
                    x = (layers.length - layerIndex - 1) * layerSpacing + 100
                    y = (nodeIndex - (layerSize - 1) / 2) * nodeSpacing + 300
                    break
                case 'BT':
                    x = (nodeIndex - (layerSize - 1) / 2) * nodeSpacing + 400
                    y = (layers.length - layerIndex - 1) * layerSpacing + 100
                    break
                default: // TB
                    x = (nodeIndex - (layerSize - 1) / 2) * nodeSpacing + 400
                    y = layerIndex * layerSpacing + 100
                    break
            }
            
            return {
                ...node,
                position: { x, y },
            }
        })
    }

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

    // Enhanced process nodes with layout algorithm selection
    const processNodes = async (
        rawNodes: Node[], 
        rawEdges: Edge[] = [], 
        layoutAlgorithm: LayoutAlgorithm = selectedLayout
    ): Promise<Node[]> => {
        console.log(`🔧 Processing nodes with ${layoutAlgorithm} layout...`)
        if (!rawNodes || rawNodes.length === 0) {
            return rawNodes
        }

        setIsApplyingLayout(true)

        // First apply basic styling and z-index to nodes
        const styledNodes = rawNodes.map((node) => {
            const newNode = { ...node }

            if (node.data?.type === 'file_subflow') {
                // File container styling
                if (newNode.style) {
                    newNode.style = {
                        ...newNode.style,
                        minWidth: '600px',
                        minHeight: '500px',
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

        // Apply selected layout algorithm
        try {
            let layoutedNodes: Node[]

            if (layoutAlgorithm === 'manual') {
                // Keep original positions for manual mode
                layoutedNodes = styledNodes
            } else if (layoutAlgorithm.startsWith('elk-')) {
                layoutedNodes = await applyELKLayout(styledNodes, rawEdges, layoutAlgorithm)
            } else if (layoutAlgorithm.startsWith('dagre-')) {
                const direction = layoutAlgorithm.split('-')[1].toUpperCase() as 'TB' | 'LR' | 'BT' | 'RL'
                layoutedNodes = applyDagreLayout(styledNodes, rawEdges, direction)
            } else if (layoutAlgorithm === 'force-directed') {
                layoutedNodes = applyForceDirectedLayout(styledNodes, rawEdges)
            } else if (layoutAlgorithm === 'circular') {
                layoutedNodes = applyCircularLayout(styledNodes, rawEdges)
            } else {
                // Fallback to ELK layered
                layoutedNodes = await applyELKLayout(styledNodes, rawEdges, 'elk-layered')
            }

            console.log(`✅ ${layoutAlgorithm} layout applied to ${layoutedNodes.length} nodes`)
            return layoutedNodes
        } catch (error) {
            console.error(`❌ ${layoutAlgorithm} layout failed, falling back to styled nodes:`, error)
            return styledNodes
        } finally {
            setIsApplyingLayout(false)
        }
    }

    // Keyboard shortcuts for layout switching
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                const key = event.key
                const layoutIndex = parseInt(key) - 1
                if (layoutIndex >= 0 && layoutIndex < LAYOUT_ALGORITHMS.length) {
                    event.preventDefault()
                    handleLayoutChange(LAYOUT_ALGORITHMS[layoutIndex].algorithm)
                }
                
                // Special shortcuts
                if (key === '0') {
                    event.preventDefault()
                    handleAutoLayoutToggle()
                }
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [selectedLayout, autoLayoutEnabled])

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
                        firstPair.react_flow.edges || [],
                        selectedLayout
                    )
                    setNodes(processedNodes)

                    // Process edges before setting them
                    const processedEdges = processEdges(
                        firstPair.react_flow.edges || []
                    )
                    setEdges(processedEdges)
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
                selectedPair.react_flow.edges || [],
                selectedLayout
            ).then((processedNodes) => {
                setNodes(processedNodes)
                // Process edges before setting them
                const processedEdges = processEdges(
                    selectedPair.react_flow.edges || []
                )
                setEdges(processedEdges)
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

    // Handle layout algorithm change
    const handleLayoutChange = async (algorithm: LayoutAlgorithm) => {
        console.log(`🔄 Changing layout to: ${algorithm}`)
        setSelectedLayout(algorithm)
        
        if (data && data.file_pairs[selectedPairIndex]) {
            const currentPair = data.file_pairs[selectedPairIndex]
            const processedNodes = await processNodes(
                currentPair.react_flow.nodes || [],
                currentPair.react_flow.edges || [],
                algorithm
            )
            setNodes(processedNodes)
        }
    }

    // Auto-layout toggle
    const handleAutoLayoutToggle = () => {
        setAutoLayoutEnabled(!autoLayoutEnabled)
        if (!autoLayoutEnabled) {
            // Re-apply current layout when enabling auto-layout
            handleLayoutChange(selectedLayout)
        }
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
        <div className="h-screen flex bg-gray-100">
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

                        {/* Auto Layout Control */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Auto Layout
                                </h2>
                                <button
                                    onClick={handleAutoLayoutToggle}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        autoLayoutEnabled
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {autoLayoutEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </button>
                            </div>
                        </div>

                        {/* Layout Algorithm Selector */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                Layout Algorithm
                            </h2>
                            
                            {/* Current Layout Display */}
                            <div className="mb-3">
                                {(() => {
                                    const currentLayout = LAYOUT_ALGORITHMS.find(
                                        l => l.algorithm === selectedLayout
                                    )
                                    return currentLayout ? (
                                        <div className={`p-3 rounded-lg border ${currentLayout.color} ${isApplyingLayout ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{currentLayout.icon}</span>
                                                <span className="font-medium text-sm">{currentLayout.name}</span>
                                                {isApplyingLayout && (
                                                    <div className="ml-auto">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs opacity-80">{currentLayout.description}</p>
                                        </div>
                                    ) : null
                                })()}
                            </div>

                            {/* Layout Algorithm Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {LAYOUT_ALGORITHMS.map((layout) => (
                                    <button
                                        key={layout.algorithm}
                                        onClick={() => handleLayoutChange(layout.algorithm)}
                                        disabled={isApplyingLayout || !autoLayoutEnabled}
                                        className={`p-2 rounded-lg border text-left transition-all text-xs ${
                                            selectedLayout === layout.algorithm
                                                ? layout.color
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        } ${
                                            isApplyingLayout || !autoLayoutEnabled 
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-sm">{layout.icon}</span>
                                            <span className="font-medium text-xs">{layout.name}</span>
                                        </div>
                                        <p className="text-xs opacity-70" style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>{layout.description}</p>
                                    </button>
                                ))}
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
                                        🚀 Current Algorithm
                                    </span>
                                    <span className="font-medium">
                                        {LAYOUT_ALGORITHMS.find(l => l.algorithm === selectedLayout)?.icon} {selectedLayout}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        🎛️ Auto Layout
                                    </span>
                                    <span className={`font-medium ${autoLayoutEnabled ? 'text-green-600' : 'text-red-600'}`}>
                                        {autoLayoutEnabled ? '✓ Active' : '✗ Disabled'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        📐 Node Dragging
                                    </span>
                                    <span className={`font-medium ${selectedLayout === 'manual' || !autoLayoutEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                                        {selectedLayout === 'manual' || !autoLayoutEnabled ? '✓ Enabled' : '✗ Locked'}
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
                            </div>
                            
                            {/* Quick Layout Tips */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <h3 className="text-xs font-semibold text-blue-900 mb-2">💡 Layout Tips</h3>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    <li>• ELK Layered: Best for hierarchical code</li>
                                    <li>• Force Directed: Good for dense networks</li>
                                    <li>• Circular: Great for exploring relationships</li>
                                    <li>• Manual: Full control over positioning</li>
                                </ul>
                            </div>
                            
                            {/* Keyboard Shortcuts */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <h3 className="text-xs font-semibold text-gray-900 mb-2">⌨️ Shortcuts</h3>
                                <ul className="text-xs text-gray-700 space-y-1">
                                    <li>• Ctrl/Cmd + 1-9: Switch layouts</li>
                                    <li>• Ctrl/Cmd + 0: Toggle auto layout</li>
                                    <li>• Use dropdown or grid for quick access</li>
                                </ul>
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
                                Code Structure Visualization (
                                {LAYOUT_ALGORITHMS.find(l => l.algorithm === selectedLayout)?.name || selectedLayout.toUpperCase()}
                                )
                            </h1>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>•</span>
                                <span>
                                    {currentPair.react_flow.files.file1} vs{' '}
                                    {currentPair.react_flow.files.file2}
                                </span>
                                <span>•</span>
                                <span>{currentPair.react_flow.flow_type}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Layout Quick Selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Layout:</span>
                                <select
                                    value={selectedLayout}
                                    onChange={(e) => handleLayoutChange(e.target.value as LayoutAlgorithm)}
                                    disabled={isApplyingLayout || !autoLayoutEnabled}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {LAYOUT_ALGORITHMS.map((layout) => (
                                        <option key={layout.algorithm} value={layout.algorithm}>
                                            {layout.icon} {layout.name}
                                        </option>
                                    ))}
                                </select>
                                {isApplyingLayout && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                            </div>

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
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        connectionMode={ConnectionMode.Loose}
                        fitView={true}
                        fitViewOptions={{
                            padding: 50,
                            includeHiddenNodes: false,
                            minZoom: 0.1,
                            maxZoom: 1.5,
                        }}
                        minZoom={0.1}
                        maxZoom={1.5}
                        nodesDraggable={selectedLayout === 'manual' || !autoLayoutEnabled}
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
 