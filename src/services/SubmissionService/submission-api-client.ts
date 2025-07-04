import {
    CreatedSubmissionResponse,
    SubmissionDTO,
    SubmissionResponse,
    ValidationError,
    ValidationFailedSubmissionResponse,
} from '@/services/SubmissionService/types.ts'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'

export const SUBMISSION_API_URL: string =
    window.RUNTIME_CONFIG?.SUBMISSION_API_URL ||
    import.meta.env.SUBMISSION_API_URL ||
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
export const sumbissionService = {
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
    createOne: async (
        submissionDto: SubmissionDTO
    ): Promise<CreatedSubmissionResponse | SubmissionApiResponse> => {
        console.log(submissionDto)
        try {
            const response = await fetch(`${SUBMISSION_API_URL}/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(submissionDto),
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
}
