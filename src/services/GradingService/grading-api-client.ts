import { PROJECT_API_URL } from '../ProjectService/project-api-client'
import {
    GradingGrid,
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingResult,
    GradingApiResponse,
    GradingCriterion,
} from '@/types/grading'
import { ApiErrorMessage } from '../ProjectService/types'

// Configuration des timeouts et retry
const API_CONFIG = {
    timeout: 10000, // 10 secondes
    retryAttempts: 2,
    retryDelay: 1000, // 1 seconde
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const

// Cache simple pour les grilles
interface CacheEntry<T> {
    data: T
    timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// Utilitaires de cache
const getCacheKey = (method: string, ...params: string[]): string => {
    return `${method}:${params.join(':')}`
}

const getFromCache = <T>(key: string): T | null => {
    const entry = cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > API_CONFIG.cacheTimeout
    if (isExpired) {
        cache.delete(key)
        return null
    }

    return entry.data
}

const setCache = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() } as CacheEntry<unknown>)
}

const invalidateCache = (pattern?: string): void => {
    if (!pattern) {
        cache.clear()
        return
    }

    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key)
        }
    }
}

// Utilitaires pour la gestion des erreurs
const handleApiError = (error: string): GradingApiResponse => {
    console.error('Grading API Error:', error)
    return { success: false, error }
}

// Utilitaire pour créer les headers d'authentification avec optimisations
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
        console.warn("Token d'authentification manquant")
    }

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
    }
}

// Utilitaire pour gérer les réponses API de manière cohérente
const handleApiResponse = async (
    response: Response
): Promise<GradingApiResponse> => {
    if (!response.ok) {
        const errorText = await response.text()
        console.error(
            `API Error - Status: ${response.status}, Response:`,
            errorText
        )

        try {
            const error: ApiErrorMessage = JSON.parse(errorText)
            return handleApiError(error.message)
        } catch {
            return handleApiError(`HTTP ${response.status}: ${errorText}`)
        }
    }

    const responseText = await response.text()

    try {
        const data = responseText ? JSON.parse(responseText) : null
        return { success: true, data }
    } catch (parseError) {
        console.error('Response parsing error:', parseError)
        return handleApiError('Erreur de parsing de la réponse')
    }
}

// Utilitaire pour faire des requêtes avec timeout
const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout = API_CONFIG.timeout
): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
        controller.abort()
        console.warn(`Requête timeout après ${timeout}ms: ${url}`)
    }, timeout)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
    } catch (error: unknown) {
        clearTimeout(timeoutId)
        if ((error as Error).name === 'AbortError') {
            throw new Error(`Timeout de ${timeout}ms dépassé pour ${url}`)
        }
        throw error
    }
}

// Utilitaire pour retry automatique avec backoff exponentiel
const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    attempts = API_CONFIG.retryAttempts
): Promise<Response> => {
    let lastError: unknown

    for (let i = 0; i <= attempts; i++) {
        try {
            return await fetchWithTimeout(url, options)
        } catch (error: unknown) {
            lastError = error

            // Ne pas retry sur certaines erreurs
            if (
                (error as Error).name === 'AbortError' ||
                ('status' in (error as Error) &&
                    (error as { status: number }).status >= 400 &&
                    (error as { status: number }).status < 500)
            ) {
                throw error
            }

            if (i === attempts) {
                throw lastError
            }

            // Backoff exponentiel
            const delay = API_CONFIG.retryDelay * Math.pow(2, i)
            console.warn(
                `Tentative ${i + 1}/${attempts + 1} échouée pour ${url}, retry dans ${delay}ms...`
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }

    throw lastError!
}

export const gradingService = {
    // Récupérer toutes les grilles d'un projet avec cache
    getProjectGrids: async (projectId: string): Promise<GradingApiResponse> => {
        try {
            const cacheKey = getCacheKey('getProjectGrids', projectId)
            const cachedData = getFromCache<GradingGrid[]>(cacheKey)

            if (cachedData) {
                console.log('📋 Grilles chargées depuis le cache:', projectId)
                return { success: true, data: cachedData }
            }

            const url = `${PROJECT_API_URL}/projects/${projectId}/grading-scales`
            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })

            const result = await handleApiResponse(response)

            if (result.success && result.data) {
                setCache<GradingGrid[]>(cacheKey, result.data as GradingGrid[])
            }

            return result
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors du chargement des grilles: ${String(error)}`
            )
        }
    },

    // Récupérer une grille par type et targetId
    getGridByTarget: async (
        projectId: string,
        type: string,
        targetId: string
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/projects/${projectId}/grading-scales?type=${type}&targetId=${targetId}`
            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })

            // Cas spécial pour 404 - pas d'erreur, juste pas de données
            if (response.status === 404) {
                return { success: true, data: undefined }
            }

            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors du chargement de la grille: ${String(error)}`
            )
        }
    },

    // Récupérer une grille spécifique avec cache
    getGrid: async (
        gridId: string,
        forceRefresh: boolean = false
    ): Promise<GradingApiResponse> => {
        try {
            const cacheKey = getCacheKey('getGrid', gridId)
            let cachedData: GradingGrid | null = null
            if (!forceRefresh) {
                cachedData = getFromCache<GradingGrid>(cacheKey)
            }

            if (cachedData) {
                console.log('📋 Grille chargée depuis le cache:', gridId)
                return { success: true, data: cachedData }
            }

            const url = `${PROJECT_API_URL}/grading-scales/${gridId}`
            console.log('📋 Chargement grille:', gridId)

            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })

            const result = await handleApiResponse(response)

            if (result.success && result.data) {
                const grid = result.data as GradingGrid
                console.log('✅ Grille chargée:', {
                    id: grid.id,
                    isValidated: grid.isValidated,
                    validatedAt: grid.validatedAt,
                })
                setCache<GradingGrid>(cacheKey, grid)
            }

            return result
        } catch (error: unknown) {
            console.error('❌ Erreur chargement grille:', error)
            return handleApiError(
                `Erreur lors du chargement de la grille: ${String(error)}`
            )
        }
    },

    // Créer une nouvelle grille avec invalidation du cache
    createGrid: async (
        projectId: string,
        gridData: CreateGradingGridDto
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales`
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(gridData),
            })

            const result = await handleApiResponse(response)

            if (result.success) {
                // Invalider le cache des grilles du projet
                invalidateCache(`getProjectGrids:${projectId}`)
            }

            return result
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors de la création de la grille: ${String(error)}`
            )
        }
    },

    // Mettre à jour une grille avec invalidation du cache
    updateGrid: async (
        gridId: string,
        gridData: UpdateGradingGridDto
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}`
            const response = await fetchWithRetry(url, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(gridData),
            })

            const result = await handleApiResponse(response)

            if (result.success) {
                // Invalider le cache de cette grille et des grilles du projet
                invalidateCache(`getGrid:${gridId}`)
                invalidateCache('getProjectGrids')
            }

            return result
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors de la mise à jour de la grille: ${String(error)}`
            )
        }
    },

    // Sauvegarder les résultats de notation
    saveResults: async (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ): Promise<GradingApiResponse> => {
        try {
            // Validation des données d'entrée
            if (!results || results.length === 0) {
                return handleApiError('Aucun résultat à sauvegarder')
            }

            // Extraire le targetGroupId du premier résultat
            const targetGroupId = results[0]?.targetGroupId
            if (!targetGroupId) {
                return handleApiError(
                    'targetGroupId manquant dans les résultats'
                )
            }

            // Formater les résultats selon les recommandations API
            const formattedResults = results.map((result) => ({
                gradingCriterionId: result.gradingCriterionId,
                score: result.score,
                comment: result.comment || '',
            }))

            const payload = {
                targetGroupId,
                results: formattedResults,
                ...(generalComment && { generalComment }),
            }

            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/results`
            console.log('💾 Sauvegarde résultats:', {
                gridId,
                targetGroupId,
                resultCount: formattedResults.length,
                hasGeneralComment: !!generalComment,
            })

            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            })

            const result = await handleApiResponse(response)

            if (result.success) {
                console.log('✅ Résultats sauvegardés avec succès')
                // Invalider le cache de cette grille
                invalidateCache(`getGrid:${gridId}`)
            }

            return result
        } catch (error: unknown) {
            console.error('❌ Erreur sauvegarde résultats:', error)
            return handleApiError(
                `Erreur lors de la sauvegarde des résultats: ${String(error)}`
            )
        }
    },

    addCriterion: async (
        gridId: string,
        criterionData: Omit<GradingCriterion, 'id'>
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/criteria`
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(criterionData),
            })
            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors de l'ajout du critère: ${String(error)}`
            )
        }
    },

    updateCriterion: async (
        criterionId: string,
        criterionData: Partial<GradingCriterion>
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/criteria/${criterionId}`
            const response = await fetchWithRetry(url, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(criterionData),
            })
            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(
                `Error while updating criteria: ${String(error)}`
            )
        }
    },

    removeCriterion: async (
        criterionId: string
    ): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/criteria/${criterionId}`
            const response = await fetchWithRetry(url, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            })

            const result = await handleApiResponse(response)

            if (result.success) {
                // Invalidate relevant cache entries after successful deletion
                invalidateCache('getProjectGrids')
                // Note: We can't invalidate specific grid cache without gridId
                console.log('✅ Criterion deleted successfully:', criterionId)
            }

            return result
        } catch (error: unknown) {
            return handleApiError(
                `Error while deleting criteria: ${String(error)}`
            )
        }
    },

    // Valider une grille
    validateGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/validate`
            console.log('🔍 Validation grille:', { gridId, url })
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: getAuthHeaders(),
            })
            const result = await handleApiResponse(response)
            if (result.success && result.data) {
                const grid = result.data as GradingGrid
                console.log('📥 Réponse reçue:', {
                    id: grid.id,
                    isValidated: grid.isValidated,
                    validatedAt: grid.validatedAt,
                })
                if (grid.isValidated) {
                    console.log('✅ Grille validée avec succès')
                    // Invalidate only the specific grid and project grids
                    invalidateCache(`getGrid:${gridId}`)
                    invalidateCache('getProjectGrids')
                } else {
                    console.warn(
                        "⚠️ La grille n'a pas été validée côté serveur"
                    )
                    return handleApiError(
                        'La validation a échoué côté serveur. Vérifiez que tous les critères sont notés.'
                    )
                }
            }
            return result
        } catch (error: unknown) {
            console.error('❌ Erreur validation grille:', error)
            return handleApiError(
                `Erreur lors de la validation de la grille: ${String(error)}`
            )
        }
    },

    // Workflow complet de validation (sauvegarde + rechargement + validation)
    validateGridWorkflow: async (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ): Promise<GradingApiResponse> => {
        try {
            console.log('=== DÉBUT WORKFLOW VALIDATION ===')
            console.log('GridId:', gridId)
            console.log('Results:', results)
            console.log('GeneralComment:', generalComment)

            // Étape 1: Sauvegarder les résultats
            console.log('Étape 1: Sauvegarde des résultats...')
            const saveResponse = await gradingService.saveResults(
                gridId,
                results,
                generalComment
            )
            if (!saveResponse.success) {
                console.error(
                    'Erreur lors de la sauvegarde:',
                    saveResponse.error
                )
                return saveResponse
            }
            console.log('Sauvegarde réussie')

            // Étape 2: Recharger la grille mise à jour
            console.log('Étape 2: Rechargement de la grille...')
            const reloadResponse = await gradingService.getGrid(gridId)
            if (!reloadResponse.success) {
                console.error(
                    'Erreur lors du rechargement:',
                    reloadResponse.error
                )
                return reloadResponse
            }
            console.log('Rechargement réussi')

            // Étape 3: Valider la grille
            console.log('Étape 3: Validation de la grille...')
            const validateResponse = await gradingService.validateGrid(gridId)
            if (!validateResponse.success) {
                console.error(
                    'Erreur lors de la validation:',
                    validateResponse.error
                )
                return validateResponse
            }
            console.log('Validation réussie')
            console.log('=== FIN WORKFLOW VALIDATION ===')

            return validateResponse
        } catch (error: unknown) {
            console.error('Erreur dans le workflow de validation:', error)
            return handleApiError(
                `Erreur dans le workflow de validation: ${String(error)}`
            )
        }
    },

    // Supprimer une grille avec invalidation du cache
    deleteGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}`
            const response = await fetchWithRetry(url, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            })

            const result = await handleApiResponse(response)

            if (result.success) {
                // Invalider le cache de cette grille et des grilles du projet
                invalidateCache(`getGrid:${gridId}`)
                invalidateCache('getProjectGrids')
            }

            return result
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors de la suppression de la grille: ${String(error)}`
            )
        }
    },

    // Récupérer les résultats d'une grille
    getGridResults: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/results`
            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })
            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(
                `Erreur lors du chargement des résultats de la grille: ${String(error)}`
            )
        }
    },

    // Utilitaire pour vider le cache manuellement
    clearCache: (): void => {
        invalidateCache()
        console.log('🗑️ Cache vidé manuellement')
    },
}
