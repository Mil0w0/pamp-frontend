import { Edge, Node } from 'reactflow'

// New types matching the real API structure
export interface SubmissionSimilarity {
    similarity_id: string
    compared_submission_id: string
    compared_submission_link: string
    overall_similarity: number
    jaccard_similarity: number
    type_similarity: number
    structural_similarity: number
    type_sequence_similarity: number
    flow_similarity: number
    operation_similarity: number
    status: string
    created_at: string
    processing_time_seconds: number
    error_message: string | null
}

export interface SubmissionSimilarityResponse {
    submission_id: string
    total_comparisons: number
    high_similarity_count: number
    similarities: SubmissionSimilarity[]
}

export interface DetailedSimilaritySubmission {
    id: string
    link: string
    description: string | null
    submitted_by_uuid: string | null
    upload_date_time: string
}

export interface DetailedSimilarityMetrics {
    overall_similarity: number
    jaccard_similarity: number
    type_similarity: number
    structural_similarity: number
    type_sequence_similarity: number
    flow_similarity: number
    operation_similarity: number
}

export interface DetailedSimilarityAnalysis {
    detection_algorithm: string
    detection_version: string
    status: string
    created_at: string
    updated_at: string
    processing_time_seconds: number
    error_message: string | null
}

export interface DetailedSimilarityDetails {
    algorithm: string
    common_elements: number
    total_unique_elements: number
    tokens_count: {
        submission1: number
        submission2: number
    }
    files_count: {
        submission1: number
        submission2: number
    }
}

export interface SharedBlock {
    id: string
    type: string
    content: string
    similarity_score: number
    positions: {
        file1: { start: number; end: number }
        file2: { start: number; end: number }
    }
}

export interface DetailedSimilarityResponse {
    similarity_id: string
    submissions: {
        submission1: DetailedSimilaritySubmission
        submission2: DetailedSimilaritySubmission
    }
    similarity_metrics: DetailedSimilarityMetrics
    analysis_metadata: DetailedSimilarityAnalysis
    detailed_results: {
        similarity_details: DetailedSimilarityDetails | null
        shared_blocks: SharedBlock[] | null
        visualization_data: FilePair[] | null
    }
}

// Keep existing types for compatibility
export interface SimilarityResponse {
    timestamp: string
    total_file_pairs_with_similarity: number
    layout_used: string
    file_pairs: FilePair[]
    // Add metadata from the new API
    submission_info?: {
        submission_id: string
        similarities: SubmissionSimilarity[]
        selected_similarity_id?: string
    }
}

export interface FilePair {
    file_pair: {
        file_from_submission1: string
        file_from_submission2: string
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

export interface LayoutState {
    isApplyingLayout: boolean
    isTransitioning: boolean
    zoomLevel?: number
    viewportX?: number
    viewportY?: number
}

export interface NodeStats {
    fileNodes: number
    functionNodes: number
    importGroups: number
    similarityComments: number
    similarFunctions: number
    fileSubflows: number
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
