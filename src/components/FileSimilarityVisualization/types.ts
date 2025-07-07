import { Node, Edge } from 'reactflow'

export interface SimilarityResponse {
    timestamp: string
    total_file_pairs_with_similarity: number
    layout_used: string
    file_pairs: FilePair[]
}

export interface FilePair {
    file_pair: {
        calculator_file: string
        game_file: string
    }
    react_flow: {
        nodes: Node[]
        edges: Edge[]
        has_similarity: boolean
        analysis_metadata: {
            total_similarities: number
            average_similarity: number
            algorithm: string
            analysis_version: string
        }
        file_metadata: {
            file1: {
                name: string
                functions: number
            }
            file2: {
                name: string
                functions: number
            }
        }
    }
}

export interface NodeStats {
    fileNodes: number
    functionNodes: number
    importGroups: number
    similarityComments: number
    similarFunctions: number
    fileSubflows: number
}

export interface BoundaryInfo {
    width: number
    height: number
    minX: number
    minY: number
}

export interface LayoutState {
    isApplyingLayout: boolean
    isApplyingZoom: boolean
    isTransitioning: boolean
}

export interface SimilarityVisualizationState {
    data: SimilarityResponse | null
    loading: boolean
    error: string | null
    selectedPairIndex: number
    sidebarCollapsed: boolean
    layoutState: LayoutState
    selectedSimilarityNode: Node | null
    isComparisonOpen: boolean
}
