import {
    //useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    useReducer,
} from 'react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import {
    GradingGrid,
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingResult,
    GradingCriterion,
    GradingStats,
    GradingApiResponse,
} from '@/types/grading'
import {
    calculateGradingStats,
    validateGridCompleteness,
    validateResultsCompleteness,
    canValidateGrid,
} from '@/utils/gradingCalculations'
import { ErrorInfo, getGradingErrorMessage } from '@/utils/errorHandling'
import { toast } from 'sonner'

type State = {
    grid: GradingGrid | null
    grids: GradingGrid[]
    loading: boolean
    saving: boolean
    error: ErrorInfo | null
}

type Action =
    | { type: 'SET_GRID'; payload: GradingGrid | null }
    | { type: 'SET_GRIDS'; payload: GradingGrid[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: ErrorInfo | null }
    | { type: 'ADD_CRITERION'; payload: GradingCriterion }
    | {
          type: 'UPDATE_CRITERION'
          payload: { id: string; updates: Partial<GradingCriterion> }
      }
    | { type: 'REMOVE_CRITERION'; payload: string }
    | { type: 'UPDATE_RESULT'; payload: GradingResult }
    | { type: 'UPDATE_GRID_IN_STATE'; payload: GradingGrid }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_GRID':
            return { ...state, grid: action.payload }
        case 'SET_GRIDS':
            return { ...state, grids: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_SAVING':
            return { ...state, saving: action.payload }
        case 'SET_ERROR':
            return { ...state, error: action.payload }
        case 'ADD_CRITERION':
            if (!state.grid) return state
            return {
                ...state,
                grid: {
                    ...state.grid,
                    criteria: [...state.grid.criteria, action.payload],
                },
            }
        case 'UPDATE_CRITERION':
            if (!state.grid) return state
            return {
                ...state,
                grid: {
                    ...state.grid,
                    criteria: state.grid.criteria.map((c) =>
                        c.id === action.payload.id
                            ? { ...c, ...action.payload.updates }
                            : c
                    ),
                },
            }
        case 'REMOVE_CRITERION':
            if (!state.grid) return state
            return {
                ...state,
                grid: {
                    ...state.grid,
                    criteria: state.grid.criteria.filter(
                        (c) => c.id !== action.payload
                    ),
                    results: state.grid.results.filter(
                        (r) => r.gradingCriterionId !== action.payload
                    ),
                },
            }
        case 'UPDATE_RESULT':
            if (!state.grid) return state
            return {
                ...state,
                grid: {
                    ...state.grid,
                    results: [
                        ...state.grid.results.filter(
                            (r) =>
                                r.gradingCriterionId !==
                                action.payload.gradingCriterionId
                        ),
                        action.payload,
                    ],
                },
            }
        case 'UPDATE_GRID_IN_STATE':
            return {
                ...state,
                grid: action.payload,
                grids: state.grids.map((g) =>
                    g.id === action.payload.id ? action.payload : g
                ),
            }
        default:
            return state
    }
}

interface UseGradingGridProps {
    projectId?: string
    gridId?: string
    type?: string
    targetId?: string
}

interface UseGradingGridReturn {
    grid: GradingGrid | null
    grids: GradingGrid[]
    loading: boolean
    saving: boolean
    error: ErrorInfo | null
    stats: GradingStats | null
    loadGrid: (gridId: string) => Promise<void>
    loadGridByTarget: (
        projectId: string,
        type: string,
        targetId: string
    ) => Promise<GradingApiResponse>
    loadProjectGrids: (projectId: string) => Promise<void>
    createGrid: (gridData: CreateGradingGridDto) => Promise<GradingGrid | null>
    updateGrid: (
        gridId: string,
        gridData: UpdateGradingGridDto
    ) => Promise<GradingGrid | null>
    saveResults: (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ) => Promise<GradingApiResponse>
    validateGrid: (gridId: string) => Promise<GradingApiResponse>
    deleteGrid: (gridId: string) => Promise<void>
    addCriterion: (
        gridId: string,
        criterion: Omit<GradingCriterion, 'id'>
    ) => Promise<GradingCriterion | null>
    updateCriterion: (
        gridId: string,
        criterionId: string,
        updates: Partial<GradingCriterion>
    ) => Promise<GradingCriterion | null>
    removeCriterion: (gridId: string, criterionId: string) => Promise<void>
    updateResult: (result: GradingResult) => void
    clearError: () => void
    isGridComplete: boolean
    isResultsComplete: boolean
    canValidate: boolean
    missingFields: string[]
    missingCriteria: string[]
}

export const useGradingGrid = ({
    projectId,
    gridId,
    type,
    targetId,
}: UseGradingGridProps = {}): UseGradingGridReturn => {
    const initialState: State = {
        grid: null,
        grids: [],
        loading: false,
        saving: false,
        error: null,
    }
    const [state, dispatch] = useReducer(reducer, initialState)
    const { grid, grids, loading, saving, error } = state

    const loadingRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)

    const stats = useMemo<GradingStats | null>(() => {
        return grid ? calculateGradingStats(grid.criteria, grid.results) : null
    }, [grid])

    const validation = useMemo(() => {
        if (!grid) {
            return {
                isGridComplete: false,
                isResultsComplete: false,
                canValidate: false,
                missingFields: [],
                missingCriteria: [],
            }
        }

        const gridValidation = validateGridCompleteness(grid)
        const resultsValidation = validateResultsCompleteness(
            grid.criteria,
            grid.results
        )

        return {
            isGridComplete: gridValidation.isComplete,
            isResultsComplete: resultsValidation.isComplete,
            canValidate: canValidateGrid(grid),
            missingFields: gridValidation.missingFields,
            missingCriteria: resultsValidation.missingCriteria,
        }
    }, [grid])

    const {
        isGridComplete,
        isResultsComplete,
        canValidate,
        missingFields,
        missingCriteria,
    } = validation

    const handleError = useCallback((error: unknown, context: string) => {
        console.error(`Error ${context}:`, error)
        dispatch({
            type: 'SET_ERROR',
            payload: getGradingErrorMessage(
                error instanceof Error ? error : String(error),
                context
            ),
        })
    }, [])

    const cancelPendingRequests = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()
        return abortControllerRef.current.signal
    }, [])

    const loadGrid = useCallback(
        async (gridId: string) => {
            if (loadingRef.current) return

            console.log('📋 Loading grid:', gridId)
            loadingRef.current = true
            dispatch({ type: 'SET_LOADING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })

            const signal = cancelPendingRequests()

            try {
                const response = await gradingService.getGrid(gridId)

                if (signal.aborted) return

                if (response.success && response.data) {
                    const newGrid = response.data as GradingGrid
                    // Charger les résultats réels depuis l'API
                    const resultsResponse =
                        await gradingService.getGridResults(gridId)
                    if (
                        resultsResponse.success &&
                        Array.isArray(resultsResponse.data)
                    ) {
                        newGrid.results =
                            resultsResponse.data as unknown as GradingResult[]
                    }
                    console.log('✓ Grid loaded:', {
                        id: newGrid.id,
                        isValidated: newGrid.isValidated,
                        validatedAt: newGrid.validatedAt,
                    })
                    dispatch({ type: 'SET_GRID', payload: newGrid })
                } else {
                    handleError(
                        response.error || 'Error loading the grid',
                        'load_grids'
                    )
                }
            } catch (err: unknown) {
                if (!signal.aborted) {
                    handleError(err, 'load_grids')
                }
            } finally {
                loadingRef.current = false
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [handleError, cancelPendingRequests]
    )

    const loadGridByTarget = useCallback(
        async (
            projectId: string,
            type: string,
            targetId: string
        ): Promise<GradingApiResponse> => {
            if (loadingRef.current) {
                return {
                    success: false,
                    error: 'Another request is in progress',
                }
            }

            if (!projectId) {
                const error = 'projectId is required'
                handleError(error, 'load_grid_by_target')
                return { success: false, error }
            }

            console.log('📋 Loading grid by target:', {
                projectId,
                type,
                targetId,
            })
            loadingRef.current = true
            dispatch({ type: 'SET_LOADING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })

            const signal = cancelPendingRequests()

            try {
                const response = await gradingService.getGridByTarget(
                    projectId,
                    type,
                    targetId
                )

                if (signal.aborted) {
                    return { success: false, error: 'Request aborted' }
                }

                if (response.success) {
                    dispatch({
                        type: 'SET_GRID',
                        payload: (response.data as GradingGrid) || null,
                    })
                } else {
                    handleError(
                        response.error || 'Error loading the grid',
                        'load_grid_by_target'
                    )
                }
                return response
            } catch (err: unknown) {
                if (!signal.aborted) {
                    handleError(err, 'load_grid_by_target')
                }
                return { success: false, error: String(err) }
            } finally {
                loadingRef.current = false
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [handleError, cancelPendingRequests]
    )

    const loadProjectGrids = useCallback(
        async (projectId: string) => {
            if (loadingRef.current) return

            console.log('📋 Loading project grids:', projectId)
            loadingRef.current = true
            dispatch({ type: 'SET_LOADING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })

            const signal = cancelPendingRequests()

            try {
                const response = await gradingService.getProjectGrids(projectId)
                console.log('loadProjectGrids response:', response)
                console.log(
                    'Number of grids received:',
                    Array.isArray(response.data) ? response.data.length : 0
                )

                if (signal.aborted) return

                if (response.success && response.data) {
                    // Charger les résultats pour chaque grille
                    const gridsWithResults = await Promise.all(
                        (response.data as GradingGrid[]).map(async (grid) => {
                            try {
                                const resultsResponse =
                                    await gradingService.getGridResults(grid.id)
                                if (
                                    resultsResponse.success &&
                                    Array.isArray(resultsResponse.data)
                                ) {
                                    return {
                                        ...grid,
                                        results:
                                            resultsResponse.data as unknown as GradingResult[],
                                    }
                                }
                            } catch (e: unknown) {
                                // Ignore error, fallback to grid without results
                                console.error(
                                    'Error loading results for grid:',
                                    grid.id,
                                    e
                                )
                            }
                            return { ...grid, results: [] }
                        })
                    )
                    dispatch({
                        type: 'SET_GRIDS',
                        payload: gridsWithResults,
                    })
                    console.log('Grids with results successfully set in state')
                } else {
                    handleError(
                        response.error || 'Error loading grids',
                        'load_grids'
                    )
                }
            } catch (err: unknown) {
                if (!signal.aborted) {
                    handleError(err, 'load_grids')
                }
            } finally {
                loadingRef.current = false
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [handleError, cancelPendingRequests]
    )

    const createGrid = useCallback(
        async (gridData: CreateGradingGridDto): Promise<GradingGrid | null> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })
            try {
                const response = await gradingService.createGrid(
                    gridData.projectId,
                    gridData
                )
                if (response.success && response.data) {
                    const newGrid = response.data as GradingGrid
                    if (gridData.projectId) {
                        await loadProjectGrids(gridData.projectId)
                    }
                    toast.success('New grading grid created successfully')
                    return newGrid
                } else {
                    handleError(
                        response.error || 'Error creating the grid',
                        'create_grid'
                    )
                    return null
                }
            } catch (err: unknown) {
                handleError(err, 'create_grid')
                return null
            } finally {
                dispatch({ type: 'SET_SAVING', payload: false })
            }
        },
        [handleError, loadProjectGrids]
    )

    const updateGridInState = useCallback((updatedGrid: GradingGrid) => {
        dispatch({ type: 'UPDATE_GRID_IN_STATE', payload: updatedGrid })
    }, [])

    const updateGrid = useCallback(
        async (
            gridId: string,
            gridData: UpdateGradingGridDto
        ): Promise<GradingGrid | null> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })

            const originalGrid = state.grid

            try {
                // Update title separately if it has changed
                if (originalGrid && gridData.title !== originalGrid.title) {
                    await gradingService.updateGrid(gridId, {
                        title: gridData.title,
                    })
                }

                // Handle criteria changes
                if (gridData.criteria) {
                    const originalCriteria = originalGrid?.criteria || []

                    // Find new, updated, and deleted criteria
                    const newCriteria = gridData.criteria.filter((c) => !c.id)
                    const updatedCriteria = gridData.criteria.filter(
                        (c) =>
                            c.id &&
                            originalCriteria.some(
                                (oc) =>
                                    oc.id === c.id &&
                                    (oc.label !== c.label ||
                                        oc.maxPoints !== c.maxPoints ||
                                        oc.weight !== c.weight)
                            )
                    )
                    const deletedCriterionIds = originalCriteria
                        .filter(
                            (oc) =>
                                !gridData.criteria?.some((c) => c.id === oc.id)
                        )
                        .map((c) => c.id)

                    // Perform API calls
                    await Promise.all([
                        ...newCriteria.map((c) =>
                            gradingService.addCriterion(gridId, c)
                        ),
                        ...updatedCriteria.map((c) =>
                            gradingService.updateCriterion(c.id!, c)
                        ),
                        ...deletedCriterionIds.map((id) =>
                            gradingService.removeCriterion(id)
                        ),
                    ])
                }

                // Reload grid from server to get the final state
                const response = await gradingService.getGrid(gridId)
                if (response.success && response.data) {
                    const updatedGrid = response.data as GradingGrid
                    updateGridInState(updatedGrid)
                    toast.success('Grid updated successfully')
                    return updatedGrid
                } else {
                    handleError(
                        response.error || 'Error fetching updated grid',
                        'update_grid'
                    )
                    return null
                }
            } catch (err: unknown) {
                handleError(err, 'update_grid')
                // Optionally rollback state on error
                if (originalGrid) {
                    dispatch({ type: 'SET_GRID', payload: originalGrid })
                }
                return null
            } finally {
                dispatch({ type: 'SET_SAVING', payload: false })
            }
        },
        [handleError, updateGridInState, state.grid]
    )

    const saveResults = useCallback(
        async (
            gridId: string,
            results: GradingResult[],
            generalComment?: string
        ): Promise<GradingApiResponse> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })
            try {
                const response = await gradingService.saveResults(
                    gridId,
                    results,
                    generalComment
                )
                if (response.success && response.data) {
                    const updatedGrid = response.data as GradingGrid
                    updateGridInState(updatedGrid)
                } else {
                    handleError(
                        response.error || 'Error saving results',
                        'save_results'
                    )
                }
                return response
            } catch (err: unknown) {
                handleError(err, 'save_results')
                return { success: false, error: String(err) }
            } finally {
                dispatch({ type: 'SET_SAVING', payload: false })
            }
        },
        [handleError, updateGridInState]
    )

    const validateGrid = useCallback(
        async (gridId: string): Promise<GradingApiResponse> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })
            try {
                const response = await gradingService.validateGrid(gridId)
                if (response.success && response.data) {
                    const validatedGrid = response.data as GradingGrid
                    updateGridInState(validatedGrid)
                    if (!validatedGrid.isValidated) {
                        console.warn('⚠️ Grid not validated on server')
                        handleError(
                            'The grid could not be validated. Please ensure all criteria are scored.',
                            'validate_grid'
                        )
                    } else {
                        console.log('✅ Grid validated successfully')
                        toast.success('Grading grid validated successfully')
                    }
                } else {
                    handleError(
                        response.error || 'Error validating the grid',
                        'validate_grid'
                    )
                }
                return response
            } catch (err: unknown) {
                handleError(err, 'validate_grid')
                return { success: false, error: String(err) }
            } finally {
                dispatch({ type: 'SET_SAVING', payload: false })
            }
        },
        [handleError, updateGridInState]
    )

    const deleteGrid = useCallback(
        async (gridId: string) => {
            dispatch({ type: 'SET_SAVING', payload: true })
            dispatch({ type: 'SET_ERROR', payload: null })
            try {
                const response = await gradingService.deleteGrid(gridId)
                if (response.success) {
                    dispatch({ type: 'SET_GRID', payload: null })
                    dispatch({
                        type: 'SET_GRIDS',
                        payload: grids.filter((g) => g.id !== gridId),
                    })
                } else {
                    handleError(
                        response.error || 'Error deleting the grid',
                        'delete_grid'
                    )
                }
            } catch (err: unknown) {
                handleError(err, 'delete_grid')
            } finally {
                dispatch({ type: 'SET_SAVING', payload: false })
            }
        },
        [handleError, grids]
    )

    const addCriterion = useCallback(
        async (
            gridId: string,
            criterion: Omit<GradingCriterion, 'id'>
        ): Promise<GradingCriterion | null> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            try {
                const response = await gradingService.addCriterion(
                    gridId,
                    criterion
                )

                if (response.success && response.data) {
                    const newCriterion =
                        response.data as unknown as GradingCriterion
                    dispatch({
                        type: 'ADD_CRITERION',
                        payload: newCriterion,
                    })
                    dispatch({ type: 'SET_SAVING', payload: false })
                    return newCriterion
                } else {
                    const errorInfo = getGradingErrorMessage(
                        response.error || 'Failed to add criterion',
                        'add_criterion'
                    )
                    dispatch({ type: 'SET_ERROR', payload: errorInfo })
                    dispatch({ type: 'SET_SAVING', payload: false })
                    toast.error(errorInfo.message)
                    return null
                }
            } catch (error: unknown) {
                const errorInfo = getGradingErrorMessage(
                    error instanceof Error ? error : String(error),
                    'add_criterion'
                )
                dispatch({ type: 'SET_ERROR', payload: errorInfo })
                dispatch({ type: 'SET_SAVING', payload: false })
                toast.error(errorInfo.message)
                return null
            }
        },
        []
    )

    const updateCriterion = useCallback(
        async (
            criterionId: string,
            updates: Partial<GradingCriterion>
        ): Promise<GradingCriterion | null> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            try {
                const response = await gradingService.updateCriterion(
                    criterionId,
                    updates
                )
                if (response.success && response.data) {
                    const updatedCriterion =
                        response.data as unknown as GradingCriterion
                    dispatch({
                        type: 'UPDATE_CRITERION',
                        payload: {
                            id: criterionId,
                            updates: updatedCriterion,
                        },
                    })
                    dispatch({ type: 'SET_SAVING', payload: false })
                    return updatedCriterion
                } else {
                    const errorInfo = getGradingErrorMessage(
                        response.error || 'Failed to update criterion',
                        'update_criterion'
                    )
                    dispatch({ type: 'SET_ERROR', payload: errorInfo })
                    dispatch({ type: 'SET_SAVING', payload: false })
                    toast.error(errorInfo.message)
                    return null
                }
            } catch (error: unknown) {
                const errorInfo = getGradingErrorMessage(
                    error instanceof Error ? error : String(error),
                    'update_criterion'
                )
                dispatch({ type: 'SET_ERROR', payload: errorInfo })
                dispatch({ type: 'SET_SAVING', payload: false })
                toast.error(errorInfo.message)
                return null
            }
        },
        []
    )

    const removeCriterion = useCallback(
        async (_gridId: string, criterionId: string): Promise<void> => {
            dispatch({ type: 'SET_SAVING', payload: true })
            try {
                const response =
                    await gradingService.removeCriterion(criterionId)
                if (response.success) {
                    dispatch({ type: 'REMOVE_CRITERION', payload: criterionId })
                    // Invalidate cache for the specific grid
                    gradingService.clearCache()
                    toast.success('Criterion deleted successfully')
                } else {
                    throw new Error(
                        response.error || 'Failed to delete criterion'
                    )
                }
                dispatch({ type: 'SET_SAVING', payload: false })
            } catch (error: unknown) {
                const errorInfo = getGradingErrorMessage(
                    error instanceof Error ? error : String(error),
                    'remove_criterion'
                )
                dispatch({ type: 'SET_ERROR', payload: errorInfo })
                dispatch({ type: 'SET_SAVING', payload: false })
                toast.error(errorInfo.message)
            }
        },
        []
    )

    const updateResult = useCallback((result: GradingResult) => {
        dispatch({ type: 'UPDATE_RESULT', payload: result })
    }, [])

    const clearError = useCallback(() => {
        dispatch({ type: 'SET_ERROR', payload: null })
    }, [])

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    useEffect(() => {
        if (gridId) {
            loadGrid(gridId)
        } else if (projectId && type && targetId) {
            loadGridByTarget(projectId, type, targetId)
        } else if (projectId) {
            loadProjectGrids(projectId)
        }
    }, [
        gridId,
        projectId,
        type,
        targetId,
        loadGrid,
        loadGridByTarget,
        loadProjectGrids,
    ])

    const handleGridUpdate = useCallback(() => {
        console.log('🔄 Reloading grid after update')
        if (gridId) {
            loadGrid(gridId)
        } else if (projectId && type && targetId) {
            loadGridByTarget(projectId, type, targetId)
        }
        if (projectId) {
            loadProjectGrids(projectId)
        }
    }, [
        gridId,
        projectId,
        type,
        targetId,
        loadGrid,
        loadGridByTarget,
        loadProjectGrids,
    ])

    useEffect(() => {
        window.addEventListener('grading-grid-updated', handleGridUpdate)
        return () => {
            window.removeEventListener('grading-grid-updated', handleGridUpdate)
        }
    }, [handleGridUpdate])

    return {
        grid,
        grids,
        loading,
        saving,
        error,
        stats,
        loadGrid,
        loadGridByTarget,
        loadProjectGrids,
        createGrid,
        updateGrid,
        saveResults,
        validateGrid,
        deleteGrid,
        addCriterion,
        updateCriterion: async (
            _gridId: string,
            criterionId: string,
            updates: Partial<GradingCriterion>
        ) => {
            return updateCriterion(criterionId, updates)
        },
        removeCriterion,
        updateResult,
        clearError,
        isGridComplete,
        isResultsComplete,
        canValidate,
        missingFields,
        missingCriteria,
    }
}
