import { CreateProjectDto, Project } from '@/components/ManageProjects/types'

export const PROJECT_API_URL: string =
    import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:3001'

const handleApiError = (error: string): ProjectApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}

const handleReportDefinitionApiError = (error: string): ReportDefinitionApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
export type ApiErrorMessage = {
    message: string
    statusCode: number
    error: string
}
export type ProjectApiResponse = {
    error?: string
    success: boolean
    data?: Project | Project[]
}

// Report Definition Types
export type ReportDefinitionFormat = 'CLASSIC' | 'QUESTIONNAIRE'

export interface ReportDefinitionQuestion {
    id: string
    text: string
}

export interface ReportDefinition {
    id?: string
    projectId: string
    isActive: boolean
    format: ReportDefinitionFormat
    instruction?: string
    questions?: ReportDefinitionQuestion[]
}

export interface UpsertReportDefinitionDto {
    isActive: boolean
    format: ReportDefinitionFormat
    instruction?: string
    questions?: string // JSON string in API
}

export type ReportDefinitionApiResponse = {
    error?: string
    success: boolean
    data?: ReportDefinition
}

export const projectService = {
    getOneById: async (id: string): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const project: Project = await response.json()
                console.log(project)
                return {
                    success: true,
                    data: project,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
    getAll: async (): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const projects: Project[] = await response.json()
                console.log(projects)
                return {
                    success: true,
                    data: projects,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },

    createBatch: async (
        projectDtoPost: CreateProjectDto
    ): Promise<ProjectApiResponse> => {
        console.log(projectDtoPost)
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(projectDtoPost),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const batch: Project = await response.json()
            return { success: response.ok, data: batch }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    copyProject: async (projectId: string): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const project: Project = await response.json()
            return { success: response.ok, data: project }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    deleteBatch: async (id: string): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const batch: Project = await response.json()
                return {
                    success: true,
                    data: batch,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },

    // Report Definition Methods
    getReportDefinition: async (projectId: string): Promise<ReportDefinitionApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects/${projectId}/report-definition`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                if (response.status === 404) {
                    // No report definition exists yet
                    return {
                        success: true,
                        data: undefined
                    }
                }
                const error: ApiErrorMessage = await response.json()
                return handleReportDefinitionApiError(error.message)
            } else {
                const reportDefinition: ReportDefinition = await response.json()
                // Parse questions if they exist and are a string
                if (reportDefinition.questions && typeof reportDefinition.questions === 'string') {
                    try {
                        reportDefinition.questions = JSON.parse(reportDefinition.questions as unknown as string)
                    } catch (e) {
                        console.warn('Failed to parse questions JSON:', e)
                        reportDefinition.questions = []
                    }
                }
                return {
                    success: true,
                    data: reportDefinition,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleReportDefinitionApiError(err.message)
        }
    },

    upsertReportDefinition: async (projectId: string, reportDefinition: UpsertReportDefinitionDto): Promise<ReportDefinitionApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects/${projectId}/report-definition`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(reportDefinition),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleReportDefinitionApiError(error.message)
            }
            const updatedReportDefinition: ReportDefinition = await response.json()
            // Parse questions if they exist and are a string
            if (updatedReportDefinition.questions && typeof updatedReportDefinition.questions === 'string') {
                try {
                    updatedReportDefinition.questions = JSON.parse(updatedReportDefinition.questions as unknown as string)
                } catch (e) {
                    console.warn('Failed to parse questions JSON:', e)
                    updatedReportDefinition.questions = []
                }
            }
            return { 
                success: response.ok, 
                data: updatedReportDefinition 
            }
        } catch (error) {
            const err = error as Error
            return handleReportDefinitionApiError(err.message)
        }
    },
}
