import { SimilarityResponse } from '@/components/FileSimilarityVisualization/types'

export const SIMILARITY_API_URL: string =
    import.meta.env.VITE_SIMILARITY_API_URL || 'http://localhost:3002'

export type ApiErrorMessage = {
    message: string
    statusCode: number
    error: string
}

export type SimilarityApiResponse = {
    error?: string
    success: boolean
    data?: SimilarityResponse
}

const handleApiError = (error: string): SimilarityApiResponse => {
    console.error('Similarity API Error:', error)
    return { success: false, error: error }
}

export const similarityService = {
    getSimilarityData: async (): Promise<SimilarityApiResponse> => {
        try {
            console.log(
                'Making API request to:',
                `${SIMILARITY_API_URL}/detection/react-flow-ast/projects`
            )

            const response = await fetch(
                `${SIMILARITY_API_URL}/detection/react-flow-ast/projects`
            )

            console.log('Response received:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            console.log('Parsing JSON response...')
            const result: SimilarityResponse = await response.json()

            console.log('JSON parsed successfully:', {
                timestamp: result.timestamp,
                layout_used: result.layout_used,
                total_file_pairs: result.file_pairs?.length,
                total_file_pairs_with_similarity:
                    result.total_file_pairs_with_similarity,
            })

            return {
                success: true,
                data: result,
            }
        } catch (error) {
            console.error('Error in similarity data fetch:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred'
            return handleApiError(errorMessage)
        }
    },
}
