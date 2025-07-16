import {
    CreateProjectDto,
    EditProjectDto,
    Project,
} from '@/components/ManageProjects/types'
import { ProjectGroup, Step } from '@/components/ProjectPages/types.ts'
import {
    ApiErrorMessage,
    GroupApiResponse,
    OralApiResponse,
    OralDTO,
    ProjectApiResponse,
    ReportDefinition,
    ReportDefinitionApiResponse,
    StepApiResponse,
    UpsertReportDefinitionDto,
} from './types'

export const PROJECT_API_URL: string =
    window.RUNTIME_CONFIG?.PROJECT_API_URL ||
    import.meta.env.VITE_PROJECT_API_URL ||
    'http://localhost:3001'

const handleApiError = (error: string): ProjectApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
const handleApiOralError = (error: string): OralApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
const handleApiGroupError = (error: string): GroupApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
const handleApiStepError = (error: string): StepApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}

const handleReportDefinitionApiError = (
    error: string
): ReportDefinitionApiResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
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
    getAll: async (userId: string): Promise<ProjectApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/projects?userId=${userId}`
            // Ligne 74 supprimée : console.log(url)
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const projects: Project[] = await response.json()

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

    createProject: async (
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
    deleteProject: async (id: string): Promise<ProjectApiResponse> => {
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

    editProject: async (
        id: string,
        projectData: EditProjectDto
    ): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/projects/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(projectData),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const project: Project = await response.json()
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
    updateSteps: async (
        projectId: string,
        stepsData: Partial<Step>[]
    ): Promise<ProjectApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/steps`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify(stepsData),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const project: Project = await response.json()
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
}

export const groupService = {
    getOneById: async (id: string): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiGroupError(error.message)
            } else {
                const project: ProjectGroup = await response.json()
                console.log(project)
                return {
                    success: true,
                    data: project,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },
    getAll: async (projectId: string): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups${projectId !== '' ? '?projectId=' + projectId : ''}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiGroupError(error.message)
            } else {
                const groups: ProjectGroup[] = await response.json()
                console.log(groups)
                //ORDER GROUPS BY THEIR NAME NUMBER
                const sortedGroups = (groups as ProjectGroup[]).sort((a, b) => {
                    const getNumber = (name: string) =>
                        parseInt(name.replace(/\D/g, ''))

                    return getNumber(a.name) - getNumber(b.name)
                })
                return {
                    success: true,
                    data: sortedGroups,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },

    submitReport: async (groupId: string): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups/${groupId}/submit-report`,
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
                return handleApiGroupError(error.message)
            } else {
                const updatedGroup: ProjectGroup = await response.json()
                console.log('Report submitted successfully:', updatedGroup)
                return {
                    success: true,
                    data: updatedGroup,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },

    delete: async (id: string): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiGroupError(error.message)
            } else {
                const batch: ProjectGroup = await response.json()
                return {
                    success: true,
                    data: batch,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },

    update: async (
        id: string,
        groupDto: { studentsIds: string }
    ): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups/${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify(groupDto),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiGroupError(error.message)
            } else {
                const groups: ProjectGroup = await response.json()
                return {
                    success: true,
                    data: groups,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },

    getMyGroups: async (): Promise<GroupApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projectGroups/myGroups`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiGroupError(error.message)
            } else {
                const groups: ProjectGroup[] = await response.json()
                return {
                    success: true,
                    data: groups,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiGroupError(err.message)
        }
    },
}

export const reportDefinitionService = {
    // Report Definition Methods
    getReportDefinition: async (
        projectId: string
    ): Promise<ReportDefinitionApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/report-definition`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                if (response.status === 404) {
                    // No report definition exists yet
                    return {
                        success: true,
                        data: undefined,
                    }
                }
                const error: ApiErrorMessage = await response.json()
                return handleReportDefinitionApiError(error.message)
            } else {
                const reportDefinition: ReportDefinition = await response.json()
                // Parse questions if they exist and are a string
                if (
                    reportDefinition.questions &&
                    typeof reportDefinition.questions === 'string'
                ) {
                    try {
                        reportDefinition.questions = JSON.parse(
                            reportDefinition.questions as unknown as string
                        )
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

    upsertReportDefinition: async (
        projectId: string,
        reportDefinition: UpsertReportDefinitionDto
    ): Promise<ReportDefinitionApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/report-definition`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify(reportDefinition),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleReportDefinitionApiError(error.message)
            }
            const updatedReportDefinition: ReportDefinition =
                await response.json()
            // Parse questions if they exist and are a string
            if (
                updatedReportDefinition.questions &&
                typeof updatedReportDefinition.questions === 'string'
            ) {
                try {
                    updatedReportDefinition.questions = JSON.parse(
                        updatedReportDefinition.questions as unknown as string
                    )
                } catch (e) {
                    console.warn('Failed to parse questions JSON:', e)
                    updatedReportDefinition.questions = []
                }
            }
            return {
                success: response.ok,
                data: updatedReportDefinition,
            }
        } catch (error) {
            const err = error as Error
            return handleReportDefinitionApiError(err.message)
        }
    },
}

export const stepsService = {
    getOneById: async (
        id: string,
        projectId: string
    ): Promise<StepApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/steps/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiStepError(error.message)
            } else {
                const project: Step = await response.json()
                console.log(project)
                return {
                    success: true,
                    data: project,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiStepError(err.message)
        }
    },
    update: async (
        projectId: string,
        id: string | undefined,
        stepDTP: Partial<Step>
    ): Promise<StepApiResponse> => {
        if (!id) return handleApiStepError('Step id missing')
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/steps/${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify(stepDTP),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiStepError(error.message)
            } else {
                const step: Step = await response.json()
                return {
                    success: true,
                    data: step,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiStepError(err.message)
        }
    },
}
export const planningService = {
    create: async (dto: OralDTO) => {
        console.log(dto)
        try {
            const response = await fetch(`${PROJECT_API_URL}/orals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(dto),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const oral: OralDTO = await response.json()
            return { success: response.ok, data: oral }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    update: async (oralId: string, dto: OralDTO) => {
        console.log(dto)
        try {
            const response = await fetch(`${PROJECT_API_URL}/orals/${oralId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(dto),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const oral: OralDTO = await response.json()
            return { success: response.ok, data: oral }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    //Get all teacher orals but exclude the current project ones
    getAllTeacherOrals: async (projectID: string, userId: string) => {
        try {
            const token = localStorage.getItem('auth_token')

            // Get all projects for the teacher
            const response = await fetch(
                `${PROJECT_API_URL}/projects?userId=${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiOralError(error.message)
            }

            const projects: Project[] = await response.json()
            const otherProjects = projects.filter(
                (project: Project) => project.id !== projectID
            )

            // For each project, fetch orals
            const oralFetches = otherProjects.map(async (project) => {
                const res = await fetch(
                    `${PROJECT_API_URL}/orals/projects/${project.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                if (!res.ok) return []
                const orals: OralDTO[] = await res.json()
                return orals
            })
            const allOralsArrays = await Promise.all(oralFetches)

            //Flatten the result
            const allOrals: OralDTO[] = allOralsArrays.flat()

            return { success: true, data: allOrals }
        } catch (error) {
            const err = error as Error
            return handleApiOralError(err.message)
        }
    },
}
