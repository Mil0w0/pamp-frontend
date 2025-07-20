import { Edge, Node } from 'reactflow'
import { FilePair, NodeStats } from '../types'

// Process edges to fix duplicate keys and invalid types
export const processEdges = (rawEdges: Edge[], theme: string): Edge[] => {
    console.log('Processing edges to fix duplicate keys and types...')
    const processedEdges: Edge[] = []
    const seenKeys = new Set<string>()

    rawEdges.forEach((edge) => {
        const newEdge = { ...edge }

        // Ensure unique keys
        let edgeKey = newEdge.id
        let counter = 1
        while (seenKeys.has(edgeKey)) {
            edgeKey = `${newEdge.id}_${counter}`
            counter++
        }

        if (edgeKey !== newEdge.id) {
            console.log(`Fixed duplicate edge key: ${newEdge.id} -> ${edgeKey}`)
            newEdge.id = edgeKey
        }

        // Apply theme-aware edge styling
        const isDark = theme === 'dark'

        if (newEdge.data?.type === 'similarity') {
            // Special styling for similarity edges
            newEdge.style = {
                ...newEdge.style,
                strokeWidth: 4,
                stroke: isDark ? '#ef4444' : '#dc2626',
                strokeDasharray: '12,6',
                opacity: 0.9,
                zIndex: 1001, // Even higher for similarity edges
            }

            // Label styling for similarity edges
            newEdge.labelStyle = {
                fill: isDark ? '#fecaca' : '#991b1b',
                fontWeight: 'bold',
                fontSize: '12px',
                background: isDark
                    ? 'rgba(127, 29, 29, 0.9)'
                    : 'rgba(255, 235, 238, 0.9)',
                padding: '4px 8px',
                borderRadius: '6px',
                border: isDark ? '1px solid #ef4444' : '1px solid #dc2626',
            }

            // Background styling for the label
            newEdge.labelBgPadding = [8, 4]
            newEdge.labelBgBorderRadius = 6
            newEdge.labelBgStyle = {
                fill: isDark
                    ? 'rgba(127, 29, 29, 0.9)'
                    : 'rgba(255, 235, 238, 0.9)',
                fillOpacity: 0.9,
                stroke: isDark ? '#ef4444' : '#dc2626',
                strokeWidth: 1,
            }
        } else {
            // Regular edge styling
            newEdge.style = {
                ...newEdge.style,
                strokeWidth: 2,
                stroke: isDark ? '#64748b' : '#94a3b8',
                opacity: 0.7,
                zIndex: 1000, // High z-index to appear above containers
            }

            // Label styling for regular edges
            if (newEdge.label) {
                newEdge.labelStyle = {
                    fill: isDark ? '#e2e8f0' : '#374151',
                    fontWeight: '500',
                    fontSize: '11px',
                    background: isDark
                        ? 'rgba(55, 65, 81, 0.9)'
                        : 'rgba(248, 250, 252, 0.9)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    border: isDark ? '1px solid #64748b' : '1px solid #cbd5e1',
                }

                // Background styling for the label
                newEdge.labelBgPadding = [6, 3]
                newEdge.labelBgBorderRadius = 4
                newEdge.labelBgStyle = {
                    fill: isDark
                        ? 'rgba(55, 65, 81, 0.9)'
                        : 'rgba(248, 250, 252, 0.9)',
                    fillOpacity: 0.9,
                    stroke: isDark ? '#64748b' : '#cbd5e1',
                    strokeWidth: 1,
                }
            }
        }

        seenKeys.add(edgeKey)
        processedEdges.push(newEdge)
    })

    console.log(
        `Processed ${rawEdges.length} edges, fixed ${rawEdges.length - processedEdges.length} duplicates`
    )
    return processedEdges
}

// Generate theme-aware styling based on node type
export const getNodeStyling = (node: Node, theme: string) => {
    const { data } = node
    const isDark = theme === 'dark'

    switch (data?.type) {
        case 'file_subflow':
            return {
                background: isDark
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: isDark ? '3px solid #3b82f6' : '3px solid #1976d2',
                borderRadius: '16px',
                padding: '20px',
                fontWeight: 'bold',
                boxShadow: isDark
                    ? '0 6px 16px rgba(59,130,246,0.3)'
                    : '0 6px 16px rgba(25,118,210,0.3)',
                color: isDark ? '#f1f5f9' : '#1e293b',
                textAlign: 'center' as const,
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden' as const,
                textOverflow: 'ellipsis' as const,
                opacity: 0.95,
                zIndex: -1,
            }

        case 'import_group':
            return {
                background: isDark
                    ? 'linear-gradient(135deg, #14532d 0%, #166534 100%)'
                    : 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                border: isDark ? '2px solid #22c55e' : '2px solid #4caf50',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                boxShadow: isDark
                    ? '0 2px 6px rgba(34,197,94,0.2)'
                    : '0 2px 6px rgba(76,175,80,0.2)',
                color: isDark ? '#dcfce7' : '#1b5e20',
                minWidth: '180px',
                maxWidth: '180px',
                width: '180px',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden' as const,
                textOverflow: 'ellipsis' as const,
                zIndex: 1,
            }

        case 'function':
            if (data?.has_similarity) {
                // Similar function styling
                return {
                    background: isDark
                        ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
                        : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                    border: isDark ? '3px solid #ef4444' : '3px solid #f44336',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '600',
                    boxShadow: isDark
                        ? '0 4px 12px rgba(239,68,68,0.4)'
                        : '0 4px 12px rgba(244,67,54,0.4)',
                    color: isDark ? '#fecaca' : '#b71c1c',
                    minWidth: '220px',
                    maxWidth: '220px',
                    width: '220px',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden' as const,
                    textOverflow: 'ellipsis' as const,
                    fontSize: '13px',
                    zIndex: 1,
                }
            } else {
                // Regular function styling
                return {
                    background: isDark
                        ? 'linear-gradient(135deg, #92400e 0%, #a16207 100%)'
                        : 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                    border: isDark ? '2px solid #f59e0b' : '2px solid #ff9800',
                    borderRadius: '10px',
                    padding: '10px',
                    boxShadow: isDark
                        ? '0 3px 8px rgba(245,158,11,0.2)'
                        : '0 3px 8px rgba(255,152,0,0.2)',
                    color: isDark ? '#fef3c7' : '#e65100',
                    minWidth: '220px',
                    maxWidth: '220px',
                    width: '220px',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden' as const,
                    textOverflow: 'ellipsis' as const,
                    fontSize: '13px',
                    zIndex: 1,
                }
            }

        case 'similarity_comment':
            return {
                background: isDark
                    ? 'linear-gradient(135deg, #581c87 0%, #6b21a8 100%)'
                    : 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                border: isDark ? '2px dashed #a855f7' : '2px dashed #9c27b0',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                minWidth: '200px',
                maxWidth: '280px',
                boxShadow: isDark
                    ? '0 3px 10px rgba(168,85,247,0.3)'
                    : '0 3px 10px rgba(156,39,176,0.3)',
                color: isDark ? '#e9d5ff' : '#4a148c',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden' as const,
                textOverflow: 'ellipsis' as const,
                opacity: 0.9,
                zIndex: 1,
            }

        default:
            return {
                background: isDark ? '#374151' : '#f8fafc',
                border: isDark ? '1px solid #6b7280' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px',
                color: isDark ? '#f9fafb' : '#1f2937',
                minWidth: '140px',
                zIndex: 1,
            }
    }
}

// Calculate node statistics
export const getNodeStats = (nodes: Node[]): NodeStats => {
    console.log('Calculating node stats for nodes:', nodes?.length || 0)
    if (!nodes || !Array.isArray(nodes)) {
        console.log('Invalid nodes array provided to getNodeStats')
        return {
            fileNodes: 0,
            functionNodes: 0,
            importGroups: 0,
            similarityComments: 0,
            similarFunctions: 0,
            fileSubflows: 0,
        }
    }

    const fileNodes = nodes.filter((node) => node.data?.type === 'file').length
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
        (node) => node.data?.type === 'function' && node.data?.has_similarity
    ).length

    const stats = {
        fileNodes,
        fileSubflows,
        functionNodes,
        importGroups,
        similarityComments,
        similarFunctions,
    }
    console.log('Node stats calculated:', stats)
    return stats
}

// Format code content for display
export const formatCode = (code: string): string => {
    if (!code) return 'No code available'
    // Basic formatting - in a real app you might want to use a proper code formatter
    return code.replace(/\\n/g, '\n').replace(/\\t/g, '  ')
}

// Get similarity score display
export const getSimilarityScoreDisplay = (
    node: Node,
    currentPair?: FilePair
): string => {
    if (node.data?.similarity_score !== undefined) {
        return (node.data.similarity_score * 100).toFixed(1)
    }
    if (
        node.data?.has_similarity &&
        currentPair?.react_flow?.analysis_metadata?.average_similarity
    ) {
        return (
            currentPair.react_flow.analysis_metadata.average_similarity * 100
        ).toFixed(1)
    }
    return '0'
}

// Get similarity badge variant based on score
export const getSimilarityBadgeVariant = (
    score: number
): 'destructive' | 'secondary' | 'outline' | 'default' => {
    if (score >= 0.8) return 'destructive'
    if (score >= 0.6) return 'secondary'
    if (score >= 0.4) return 'outline'
    return 'default'
}

// Truncate text with ellipsis if too long
export const truncateText = (text: string, maxLength: number): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
}

// Format node label to prevent text wrapping and show similarity percentage first
export const formatNodeLabel = (node: Node): string => {
    const originalLabel = node.data?.label || node.id
    const maxLength = 25 // Maximum characters before truncation

    // For function nodes with similarity, show percentage first
    if (node.data?.type === 'function' && node.data?.has_similarity) {
        const percentage = ((node.data?.similarity_score || 0) * 100).toFixed(0)
        const functionName = originalLabel
            .replace(/^⚡\s*/, '')
            .replace(/\s*\(\d+\.\d+%\)$/, '')
        const truncatedName = truncateText(functionName, maxLength - 8) // Reserve space for percentage
        return `${percentage}% - ${truncatedName}`
    }

    // For regular function nodes, keep emoji but truncate name
    if (node.data?.type === 'function') {
        const truncatedName = truncateText(originalLabel, maxLength - 2) // Reserve space for emoji
        return `${truncatedName}`
    }

    // For import groups
    if (node.data?.type === 'import_group') {
        const importText = originalLabel.replace(/^📦\s*/, '')
        const truncatedText = truncateText(importText, maxLength - 2)
        return `📦 ${truncatedText}`
    }

    // For file subflows
    if (node.data?.type === 'file_subflow') {
        const fileName = originalLabel.replace(/^📁\s*/, '')
        const truncatedName = truncateText(fileName, maxLength - 2)
        return `📁 ${truncatedName}`
    }

    // For all other node types, truncate normally
    return truncateText(originalLabel, maxLength)
}
