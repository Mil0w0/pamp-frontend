import {
    CreatedSubmissionResponse,
    RulesAPIAvailable,
    SubmissionDTO,
    SubmissionResponse,
    ValidationError,
    ValidationFailedSubmissionResponse,
} from '@/services/SubmissionService/types.ts'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'
import {
    DetailedSimilarityResponse,
    SubmissionSimilarityResponse,
} from '@/components/FileSimilarityVisualization/types'

export const SUBMISSION_API_URL: string =
    window.RUNTIME_CONFIG?.SUBMISSION_API_URL ||
    import.meta.env.VITE_SUBMISSION_API_URL ||
    'http://localhost:3002'

const handleSubmissionApiError = (error: string): SubmissionApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}

const handleMultipleSubmissionApiError = (
    error: string
): MultipleSubmissionApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}

const handleRulesApiError = (error: string): RulesAPIResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}

const handleSimilarityApiError = (error: string): SimilarityApiResponse => {
    console.error('Similarity API Error:', error)
    return { success: false, error: error }
}

const handleDetailedSimilarityApiError = (
    error: string
): DetailedSimilarityApiResponse => {
    console.error('Detailed Similarity API Error:', error)
    return { success: false, error: error }
}

export type SubmissionApiResponse = {
    error?: string
    success: boolean
    data?: SubmissionResponse | CreatedSubmissionResponse | ValidationError[]
}

export type MultipleSubmissionApiResponse = {
    error?: string
    success: boolean
    data?: SubmissionResponse[]
}
export type RulesAPIResponse = {
    error?: string
    success: boolean
    data?: RulesAPIAvailable
}

export type SimilarityApiResponse = {
    error?: string
    success: boolean
    data?: SubmissionSimilarityResponse
}

export type DetailedSimilarityApiResponse = {
    error?: string
    success: boolean
    data?: DetailedSimilarityResponse
}
export const submissionService = {
    getOneById: async (id: string): Promise<SubmissionApiResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleSubmissionApiError(error.message)
            } else {
                const submission: SubmissionResponse = await response.json()
                console.log(submission)
                return {
                    success: true,
                    data: submission,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleSubmissionApiError(err.message)
        }
    },
    getOneByStepAndGroup: async (
        stepId: string,
        projectId: string,
        groupId: string
    ): Promise<SubmissionApiResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/project/${projectId}/group/${groupId}/step/${stepId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                if (response.status === 404) {
                    return handleSubmissionApiError('404')
                }
                return handleSubmissionApiError(
                    'Loading submission for this group and step went wrong'
                )
            }
            const submission: CreatedSubmissionResponse = await response.json()
            return {
                success: true,
                data: submission,
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleSubmissionApiError(err.message)
        }
    },
    getAllBySteps: async (
        stepId: string,
        projectId: string
    ): Promise<MultipleSubmissionApiResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/project/${projectId}/step/${stepId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleMultipleSubmissionApiError(error.message)
            } else {
                const submission: SubmissionResponse[] = await response.json()
                console.log(submission)
                return {
                    success: true,
                    data: submission,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleMultipleSubmissionApiError(err.message)
        }
    },
    getAllByGroup: async (
        groupId: string,
        projectId: string
    ): Promise<MultipleSubmissionApiResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/project/${projectId}/group/${groupId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleMultipleSubmissionApiError(error.message)
            } else {
                const submission: SubmissionResponse[] = await response.json()
                console.log(submission)
                return {
                    success: true,
                    data: submission,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleMultipleSubmissionApiError(err.message)
        }
    },
    getAvailableRules: async (): Promise<RulesAPIResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/rules/documentation`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleRulesApiError(error.message)
            } else {
                const rules: RulesAPIAvailable = await response.json()
                return {
                    success: true,
                    data: rules,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleRulesApiError(err.message)
        }
    },
    createOne: async (
        submissionDto: SubmissionDTO,
        forceRules: boolean = false
    ): Promise<CreatedSubmissionResponse | SubmissionApiResponse> => {
        //Force creation and store unsucessful rules check
        try {
            const response = await fetch(`${SUBMISSION_API_URL}/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    ...submissionDto,
                    force_rules: forceRules,
                }),
            })
            if (!response.ok) {
                const error:
                    | ValidationFailedSubmissionResponse
                    | ApiErrorMessage = await response.json()
                console.log(error)
                if ('detail' in error) {
                    return {
                        success: false,
                        error: error.detail
                            .map((error) => error.msg)
                            .join('; '),
                        data: error.detail,
                    }
                } else {
                    return handleSubmissionApiError(error.message)
                }
            }
            const createdSubmission: CreatedSubmissionResponse =
                await response.json()

            return {
                success: true,
                data: createdSubmission,
            }
        } catch (error) {
            const err = error as Error
            return handleSubmissionApiError(err.message)
        }
    },

    deleteOne: async (submissionId: string): Promise<SubmissionApiResponse> => {
        try {
            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/${submissionId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleSubmissionApiError(error.message)
            } else {
                return { success: true }
            }
        } catch (error) {
            const err = error as Error
            return handleSubmissionApiError(err.message)
        }
    },

    // Get similarities for a submission
    getSimilarities: async (
        submissionId: string
    ): Promise<SimilarityApiResponse> => {
        try {
            console.log('Fetching similarities for submission:', submissionId)

            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/${submissionId}/similarities`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: SubmissionSimilarityResponse = await response.json()

            console.log('Similarities fetched successfully:', {
                submission_id: data.submission_id,
                total_comparisons: data.total_comparisons,
                similarities_count: data.similarities.length,
            })

            return {
                success: true,
                data,
            }
        } catch (error) {
            const err = error as Error
            return handleSimilarityApiError(err.message)
        }
    },

    // Get detailed similarity data for visualization
    getDetailedSimilarity: async (
        similarityId: string
    ): Promise<DetailedSimilarityApiResponse> => {
        try {
            console.log('Fetching detailed similarity data for:', similarityId)

            const response = await fetch(
                `${SUBMISSION_API_URL}/submissions/similarities/${similarityId}/detailed`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        accept: 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: DetailedSimilarityResponse = await response.json()

            console.log('Detailed similarity fetched successfully:', {
                similarity_id: data.similarity_id,
                visualization_data_count:
                    data.detailed_results.visualization_data?.length || 0,
                status: data.analysis_metadata.status,
            })

            return {
                success: true,
                data,
            }
        } catch (error) {
            const err = error as Error
            return handleDetailedSimilarityApiError(err.message)
        }
    },
}
