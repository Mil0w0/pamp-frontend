import { PROJECT_API_URL } from '../ProjectService/project-api-client'
import {
    GradingGrid,
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingResult,
    GradingApiResponse,
} from '@/components/GradingSystem/type'
import { ApiErrorMessage } from '../ProjectService/types'

const handleApiError = (error: string): GradingApiResponse => {
    console.error('Grading API Error:', error)
    return { success: false, error: error }
}

export const gradingService = {
    // Récupérer toutes les grilles d'un projet
    getProjectGrids: async (projectId: string): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/grading-scales`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grids: GradingGrid[] = await response.json()
            return { success: true, data: grids }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Récupérer une grille par type et targetId
    getGridByTarget: async (
        projectId: string,
        type: string,
        targetId: string
    ): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/projects/${projectId}/grading-scales?type=${type}&targetId=${targetId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                if (response.status === 404) {
                    return { success: true, data: undefined }
                }
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grid: GradingGrid = await response.json()
            return { success: true, data: grid }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Récupérer une grille spécifique
    getGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/grading-scales/${gridId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grid: GradingGrid = await response.json()
            return { success: true, data: grid }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Créer une nouvelle grille
    createGrid: async (
        projectId: string,
        gridData: CreateGradingGridDto
    ): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/grading-scales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(gridData),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grid: GradingGrid = await response.json()
            return { success: true, data: grid }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Mettre à jour une grille
    updateGrid: async (
        gridId: string,
        gridData: UpdateGradingGridDto
    ): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/grading-scales/${gridId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                    body: JSON.stringify(gridData),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grid: GradingGrid = await response.json()
            return { success: true, data: grid }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Sauvegarder les résultats de notation
    saveResults: async (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ): Promise<GradingApiResponse> => {
        try {
            const payload = { results, generalComment }
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/results`

            console.log('=== API CALL saveResults ===')
            console.log('URL:', url)
            console.log('Payload envoyé:', JSON.stringify(payload, null, 2))
            console.log('GridId:', gridId)
            console.log('Results:', results)
            console.log('GeneralComment:', generalComment)

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(payload),
            })

            console.log('Response status:', response.status)
            console.log(
                'Response headers:',
                Object.fromEntries(response.headers.entries())
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Erreur API - Status:', response.status)
                console.error('Erreur API - Response:', errorText)

                try {
                    const error: ApiErrorMessage = JSON.parse(errorText)
                    return handleApiError(error.message)
                } catch {
                    return handleApiError(
                        `HTTP ${response.status}: ${errorText}`
                    )
                }
            }

            const responseText = await response.text()
            console.log('Response body (raw):', responseText)

            try {
                const grid: GradingGrid = JSON.parse(responseText)
                console.log('Response parsed:', grid)
                console.log('=== FIN API CALL saveResults ===')
                return { success: true, data: grid }
            } catch (parseError) {
                console.error('Erreur parsing response:', parseError)
                return handleApiError('Erreur de parsing de la réponse')
            }
        } catch (error) {
            const err = error as Error
            console.error('Erreur réseau/fetch:', err)
            return handleApiError(err.message)
        }
    },

    // Valider une grille
    validateGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/grading-scales/${gridId}/validate`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const grid: GradingGrid = await response.json()
            return { success: true, data: grid }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },

    // Supprimer une grille
    deleteGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/grading-scales/${gridId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            return { success: true }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
}
