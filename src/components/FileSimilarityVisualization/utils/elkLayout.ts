import { Edge, Node } from 'reactflow'
import ELK from 'elkjs/lib/elk.bundled.js'

// Local interface for boundary calculations
interface BoundaryInfo {
    width: number
    height: number
    minX: number
    minY: number
}

// Helper function to find a node in the ELK result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const findELKNode = (elkGraph: any, nodeId: string): any => {
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

// Helper function to calculate subflow boundaries based on child positions
export const calculateSubflowBoundaries = (
    nodes: Node[]
): Map<string, BoundaryInfo> => {
    const boundaries = new Map<string, BoundaryInfo>()

    // Get all file containers
    const fileContainers = nodes.filter((n) => n.data?.type === 'file_subflow')

    fileContainers.forEach((container) => {
        // Find all children of this container
        const children = nodes.filter((n) => n.parentNode === container.id)

        if (children.length === 0) {
            // No children, use minimum size
            boundaries.set(container.id, {
                width: 400,
                height: 300,
                minX: 0,
                minY: 0,
            })
            return
        }

        // Calculate bounding box of all children
        let minX = Infinity,
            maxX = -Infinity
        let minY = Infinity,
            maxY = -Infinity

        children.forEach((child) => {
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
        const calculatedWidth = Math.max(400, maxX - minX + padding * 2)
        const calculatedHeight = Math.max(300, maxY - minY + padding * 2)

        boundaries.set(container.id, {
            width: calculatedWidth,
            height: calculatedHeight,
            minX: minX - padding,
            minY: minY - padding,
        })

        console.log(`Calculated boundaries for ${container.id}:`, {
            width: calculatedWidth,
            height: calculatedHeight,
            childrenCount: children.length,
            bounds: { minX, maxX, minY, maxY },
        })
    })

    return boundaries
}

// Helper function to adjust child positions relative to container boundaries
export const adjustChildPositions = (
    nodes: Node[],
    boundaries: Map<string, BoundaryInfo>
): Node[] => {
    return nodes.map((node) => {
        if (node.parentNode) {
            const containerBounds = boundaries.get(node.parentNode)
            if (containerBounds) {
                // Adjust child position to be relative to container's adjusted bounds
                return {
                    ...node,
                    position: {
                        x: (node.position?.x || 0) - containerBounds.minX,
                        y: (node.position?.y || 0) - containerBounds.minY,
                    },
                }
            }
        }
        return node
    })
}

// ELK Layered Layout function
export const applyELKLayout = async (
    nodes: Node[],
    edges: Edge[]
): Promise<Node[]> => {
    console.log('Applying ELK Layered layout...')

    const elk = new ELK()

    // Separate file containers from child nodes
    const fileContainers = nodes.filter((n) => n.data?.type === 'file_subflow')
    const childNodes = nodes.filter((n) => n.parentNode)
    const standaloneNodes = nodes.filter(
        (n) => !n.parentNode && n.data?.type !== 'file_subflow'
    )

    // ELK Layered layout options
    const layoutOptions = {
        'elk.padding': '[top=50,left=50,bottom=50,right=50]',
        'elk.spacing.nodeNode': '120',
        'elk.spacing.componentComponent': '150',
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.layered.spacing.nodeNodeBetweenLayers': '200',
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
            ...fileContainers.map((fileNode) => {
                const bounds = initialBoundaries.get(fileNode.id) || {
                    width: 600,
                    height: 500,
                }
                return {
                    id: fileNode.id,
                    width: bounds.width,
                    height: bounds.height,
                    layoutOptions: {
                        'elk.algorithm': 'layered',
                        'elk.direction': 'DOWN',
                        'elk.spacing.nodeNode': '60',
                        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                        'elk.padding': '[top=60,left=30,bottom=30,right=30]',
                    },
                    children: childNodes
                        .filter((child) => child.parentNode === fileNode.id)
                        .map((child) => ({
                            id: child.id,
                            width: parseFloat(
                                child.style?.width?.toString() || '180'
                            ),
                            height: parseFloat(
                                child.style?.height?.toString() || '50'
                            ),
                        })),
                }
            }),
            ...standaloneNodes.map((node) => ({
                id: node.id,
                width: parseFloat(node.style?.width?.toString() || '200'),
                height: parseFloat(node.style?.height?.toString() || '80'),
            })),
        ],
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    }

    console.log('ELK Layered graph structure:', elkGraph)

    try {
        const layoutedGraph = await elk.layout(elkGraph)
        console.log('ELK Layered layout completed:', layoutedGraph)

        // Apply the layout results back to nodes
        let layoutedNodes = nodes.map((node) => {
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
        layoutedNodes = layoutedNodes.map((node) => {
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
                        },
                    }
                }
            }
            return node
        })

        // Adjust child positions to be relative to their containers
        layoutedNodes = adjustChildPositions(layoutedNodes, finalBoundaries)

        console.log(
            `Applied ELK Layered layout to ${layoutedNodes.length} nodes with dynamic boundaries`
        )
        return layoutedNodes
    } catch (error) {
        console.error('ELK Layered layout failed:', error)
        return nodes // Return original nodes if layout fails
    }
}
