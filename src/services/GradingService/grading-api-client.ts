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

const API_CONFIG = {
    timeout: 10000,
    retryAttempts: 2,
    retryDelay: 1000,
    cacheTimeout: 5 * 60 * 1000,
} as const

interface CacheEntry<T> {
    data: T
    timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

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

const handleApiError = (error: string): GradingApiResponse => {
    console.error('Grading API Error:', error)
    return { success: false, error }
}

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
        console.warn('Authentication token missing')
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
    }
}

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
        return handleApiError('Error parsing API response')
    }
}

const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeout = API_CONFIG.timeout
): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
        controller.abort()
        console.warn(`Request timed out after ${timeout}ms: ${url}`)
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
            throw new Error(`Timeout of ${timeout}ms exceeded for ${url}`)
        }
        throw error
    }
}

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
            const delay = API_CONFIG.retryDelay * Math.pow(2, i)
            console.warn(
                `Attempt ${i + 1}/${attempts + 1} failed for ${url}, retrying in ${delay}ms...`
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
    throw lastError!
}

export const gradingService = {
    getProjectGrids: async (projectId: string): Promise<GradingApiResponse> => {
        try {
            const cacheKey = getCacheKey('getProjectGrids', projectId)
            const cachedData = getFromCache<GradingGrid[]>(cacheKey)
            if (cachedData) {
                console.log('📋 Grids loaded from cache:', projectId)
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
                `Error loading grading grids: ${String(error)}`
            )
        }
    },

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
            if (response.status === 404) {
                return { success: true, data: undefined }
            }
            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(`Error loading grid: ${String(error)}`)
        }
    },

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
                console.log('📋 Grid loaded from cache:', gridId)
                return { success: true, data: cachedData }
            }
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}`
            console.log('📋 Loading grid:', gridId)
            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })
            const result = await handleApiResponse(response)
            if (result.success && result.data) {
                const grid = result.data as GradingGrid
                console.log('✅ Grid loaded:', {
                    id: grid.id,
                    isValidated: grid.isValidated,
                    validatedAt: grid.validatedAt,
                })
                setCache<GradingGrid>(cacheKey, grid)
            }
            return result
        } catch (error: unknown) {
            console.error('❌ Error loading grid:', error)
            return handleApiError(`Error loading grid: ${String(error)}`)
        }
    },

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
                invalidateCache(`getProjectGrids:${projectId}`)
            }
            return result
        } catch (error: unknown) {
            return handleApiError(`Error creating grid: ${String(error)}`)
        }
    },

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
                invalidateCache(`getGrid:${gridId}`)
                invalidateCache('getProjectGrids')
            }
            return result
        } catch (error: unknown) {
            return handleApiError(`Error updating grid: ${String(error)}`)
        }
    },

    saveResults: async (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ): Promise<GradingApiResponse> => {
        try {
            if (!results || results.length === 0) {
                return handleApiError('No results to save')
            }
            const targetGroupId = results[0]?.targetGroupId
            if (!targetGroupId) {
                return handleApiError('targetGroupId missing in results')
            }
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
            console.log('💾 Saving results:', {
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
                console.log('✅ Results saved successfully')
                invalidateCache(`getGrid:${gridId}`)
            }
            return result
        } catch (error: unknown) {
            console.error('❌ Error saving results:', error)
            return handleApiError(`Error saving results: ${String(error)}`)
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
            return handleApiError(`Error adding criterion: ${String(error)}`)
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
            return handleApiError(`Error updating criterion: ${String(error)}`)
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
                invalidateCache('getProjectGrids')
                console.log('✅ Criterion deleted successfully:', criterionId)
            }
            return result
        } catch (error: unknown) {
            return handleApiError(`Error deleting criterion: ${String(error)}`)
        }
    },

    validateGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/validate`
            console.log('🔍 Validating grid:', { gridId, url })
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: getAuthHeaders(),
            })
            const result = await handleApiResponse(response)
            if (result.success && result.data) {
                const grid = result.data as GradingGrid
                console.log('📥 Response received:', {
                    id: grid.id,
                    isValidated: grid.isValidated,
                    validatedAt: grid.validatedAt,
                })
                if (grid.isValidated) {
                    console.log('✅ Grid validated successfully')
                    invalidateCache(`getGrid:${gridId}`)
                    invalidateCache('getProjectGrids')
                } else {
                    console.warn('⚠️ Grid was not validated on the server')
                    return handleApiError(
                        'Validation failed on the server. Please check that all criteria have been graded.'
                    )
                }
            }
            return result
        } catch (error: unknown) {
            console.error('❌ Error validating grid:', error)
            return handleApiError(`Error validating grid: ${String(error)}`)
        }
    },

    validateGridWorkflow: async (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ): Promise<GradingApiResponse> => {
        try {
            console.log('=== START VALIDATION WORKFLOW ===')
            console.log('GridId:', gridId)
            console.log('Results:', results)
            console.log('GeneralComment:', generalComment)
            const saveResponse = await gradingService.saveResults(
                gridId,
                results,
                generalComment
            )
            if (!saveResponse.success) {
                console.error('Error while saving:', saveResponse.error)
                return saveResponse
            }
            console.log('Save successful')
            const reloadResponse = await gradingService.getGrid(gridId)
            if (!reloadResponse.success) {
                console.error('Error while reloading:', reloadResponse.error)
                return reloadResponse
            }
            console.log('Reload successful')
            const validateResponse = await gradingService.validateGrid(gridId)
            if (!validateResponse.success) {
                console.error('Error while validating:', validateResponse.error)
                return validateResponse
            }
            console.log('Validation successful')
            console.log('=== END VALIDATION WORKFLOW ===')
            return validateResponse
        } catch (error: unknown) {
            console.error('Error in validation workflow:', error)
            return handleApiError(
                `Error in validation workflow: ${String(error)}`
            )
        }
    },

    deleteGrid: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}`
            const response = await fetchWithRetry(url, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            })
            const result = await handleApiResponse(response)
            if (result.success) {
                invalidateCache(`getGrid:${gridId}`)
                invalidateCache('getProjectGrids')
            }
            return result
        } catch (error: unknown) {
            return handleApiError(`Error deleting grid: ${String(error)}`)
        }
    },

    getGridResults: async (gridId: string): Promise<GradingApiResponse> => {
        try {
            const url = `${PROJECT_API_URL}/grading-scales/${gridId}/results`
            const response = await fetchWithRetry(url, {
                headers: getAuthHeaders(),
            })
            return await handleApiResponse(response)
        } catch (error: unknown) {
            return handleApiError(
                `Error loading grid results: ${String(error)}`
            )
        }
    },

    clearCache: (): void => {
        invalidateCache()
        console.log('🗑️ Cache manually cleared')
    },
}
