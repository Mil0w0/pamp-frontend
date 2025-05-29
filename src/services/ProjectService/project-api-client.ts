import { CreateProjectDto, Project } from '@/components/ManageProjects/types'

export const PROJECT_API_URL: string =
    import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:3001'

const handleApiError = (error: string): ProjectApiResponse => {
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
}
