import {
    CreatedSubmissionResponse,
    RulesAPIAvailable,
    SubmissionDTO,
    SubmissionResponse,
    ValidationError,
    ValidationFailedSubmissionResponse,
} from '@/services/SubmissionService/types.ts'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'

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
        submissionDto: SubmissionDTO
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
                    force_rules: true,
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
}
