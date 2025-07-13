import { useState, useEffect, useCallback } from 'react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import {
    GradingGrid,
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingResult,
    GradingCriterion,
    GradingStats,
} from '@/types/grading'
import {
    calculateGradingStats,
    validateGridCompleteness,
    validateResultsCompleteness,
    canValidateGrid,
} from '@/utils/gradingCalculations'
import { ErrorInfo, getGradingErrorMessage } from '@/utils/errorHandling'

interface UseGradingGridProps {
    projectId?: string
    gridId?: string
    type?: string
    targetId?: string
}

interface UseGradingGridReturn {
    // État
    grid: GradingGrid | null
    grids: GradingGrid[]
    loading: boolean
    saving: boolean
    error: ErrorInfo | null
    stats: GradingStats | null

    // Actions
    loadGrid: (gridId: string) => Promise<void>
    loadGridByTarget: (
        projectId: string,
        type: string,
        targetId: string
    ) => Promise<void>
    loadProjectGrids: (projectId: string) => Promise<void>
    createGrid: (gridData: CreateGradingGridDto) => Promise<GradingGrid | null>
    updateGrid: (
        gridId: string,
        gridData: UpdateGradingGridDto
    ) => Promise<void>
    saveResults: (
        gridId: string,
        results: GradingResult[],
        generalComment?: string
    ) => Promise<void>
    validateGrid: (gridId: string) => Promise<void>
    deleteGrid: (gridId: string) => Promise<void>

    // Utilitaires
    addCriterion: (criterion: Omit<GradingCriterion, 'id'>) => void
    updateCriterion: (
        criterionId: string,
        updates: Partial<GradingCriterion>
    ) => void
    removeCriterion: (criterionId: string) => void
    updateResult: (result: GradingResult) => void
    clearError: () => void

    // Validation
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
    const [grid, setGrid] = useState<GradingGrid | null>(null)
    const [grids, setGrids] = useState<GradingGrid[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<ErrorInfo | null>(null)

    // Calcul des statistiques
    const stats = grid
        ? calculateGradingStats(grid.criteria, grid.results)
        : null

    // Validation
    const gridValidation = grid
        ? validateGridCompleteness(grid)
        : { isComplete: false, missingFields: [] }
    const resultsValidation = grid
        ? validateResultsCompleteness(grid.criteria, grid.results)
        : { isComplete: false, missingCriteria: [] }

    const isGridComplete = gridValidation.isComplete
    const isResultsComplete = resultsValidation.isComplete
    const canValidate = grid ? canValidateGrid(grid) : false
    const missingFields = gridValidation.missingFields
    const missingCriteria = resultsValidation.missingCriteria

    // Charger une grille spécifique
    const loadGrid = useCallback(async (gridId: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await gradingService.getGrid(gridId)
            if (response.success && response.data) {
                setGrid(response.data as GradingGrid)
            } else {
                setError(
                    getGradingErrorMessage(
                        response.error ||
                            'Erreur lors du chargement de la grille',
                        'load_grids'
                    )
                )
            }
        } catch (err) {
            setError(getGradingErrorMessage(err as Error, 'load_grids'))
        } finally {
            setLoading(false)
        }
    }, [])

    // Charger une grille par type et target
    const loadGridByTarget = useCallback(
        async (projectId: string, type: string, targetId: string) => {
            setLoading(true)
            setError(null)
            try {
                const response = await gradingService.getGridByTarget(
                    projectId,
                    type,
                    targetId
                )
                if (response.success) {
                    setGrid((response.data as GradingGrid) || null)
                } else {
                    setError(
                        getGradingErrorMessage(
                            response.error ||
                                'Erreur lors du chargement de la grille',
                            'load_grids'
                        )
                    )
                }
            } catch (err) {
                setError(getGradingErrorMessage(err as Error, 'load_grids'))
            } finally {
                setLoading(false)
            }
        },
        []
    )

    // Charger toutes les grilles d'un projet
    const loadProjectGrids = useCallback(async (projectId: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await gradingService.getProjectGrids(projectId)
            if (response.success && response.data) {
                setGrids(response.data as GradingGrid[])
            } else {
                setError(
                    getGradingErrorMessage(
                        response.error ||
                            'Erreur lors du chargement des grilles',
                        'load_grids'
                    )
                )
            }
        } catch (err) {
            setError(getGradingErrorMessage(err as Error, 'load_grids'))
        } finally {
            setLoading(false)
        }
    }, [])

    // Créer une nouvelle grille
    const createGrid = useCallback(
        async (gridData: CreateGradingGridDto): Promise<GradingGrid | null> => {
            setSaving(true)
            setError(null)
            try {
                const response = await gradingService.createGrid(
                    gridData.projectId,
                    gridData
                )
                if (response.success && response.data) {
                    const newGrid = response.data as GradingGrid
                    setGrid(newGrid)
                    setGrids((prev) => [...prev, newGrid])
                    return newGrid
                } else {
                    setError(
                        getGradingErrorMessage(
                            response.error ||
                                'An error occured while creating the grid',
                            'create_grid'
                        )
                    )
                    return null
                }
            } catch (err) {
                setError(getGradingErrorMessage(err as Error, 'create_grid'))
                return null
            } finally {
                setSaving(false)
            }
        },
        []
    )

    // Mettre à jour une grille
    const updateGrid = useCallback(
        async (gridId: string, gridData: UpdateGradingGridDto) => {
            setSaving(true)
            setError(null)
            try {
                const response = await gradingService.updateGrid(
                    gridId,
                    gridData
                )
                if (response.success && response.data) {
                    const updatedGrid = response.data as GradingGrid
                    setGrid(updatedGrid)
                    setGrids((prev) =>
                        prev.map((g) => (g.id === gridId ? updatedGrid : g))
                    )
                } else {
                    setError(
                        getGradingErrorMessage(
                            response.error ||
                                'An error occurred when updating the grid',
                            'update_grid'
                        )
                    )
                }
            } catch (err) {
                setError(getGradingErrorMessage(err as Error, 'update_grid'))
            } finally {
                setSaving(false)
            }
        },
        []
    )

    // Sauvegarder les résultats
    const saveResults = useCallback(
        async (
            gridId: string,
            results: GradingResult[],
            generalComment?: string
        ) => {
            setSaving(true)
            setError(null)
            try {
                const response = await gradingService.saveResults(
                    gridId,
                    results,
                    generalComment
                )
                if (response.success && response.data) {
                    const updatedGrid = response.data as GradingGrid
                    setGrid(updatedGrid)
                    setGrids((prev) =>
                        prev.map((g) => (g.id === gridId ? updatedGrid : g))
                    )
                } else {
                    setError(
                        getGradingErrorMessage(
                            response.error ||
                                'An error occurred when saving the results',
                            'save_results'
                        )
                    )
                }
            } catch (err) {
                setError(getGradingErrorMessage(err as Error, 'save_results'))
            } finally {
                setSaving(false)
            }
        },
        []
    )

    // Valider une grille
    const validateGrid = useCallback(async (gridId: string) => {
        setSaving(true)
        setError(null)
        try {
            const response = await gradingService.validateGrid(gridId)
            if (response.success && response.data) {
                const validatedGrid = response.data as GradingGrid
                setGrid(validatedGrid)
                setGrids((prev) =>
                    prev.map((g) => (g.id === gridId ? validatedGrid : g))
                )
            } else {
                setError(
                    getGradingErrorMessage(
                        response.error ||
                            'An error occurred when validating the grid',
                        'validate_grid'
                    )
                )
            }
        } catch (err) {
            setError(getGradingErrorMessage(err as Error, 'validate_grid'))
        } finally {
            setSaving(false)
        }
    }, [])

    // Supprimer une grille
    const deleteGrid = useCallback(async (gridId: string) => {
        setSaving(true)
        setError(null)
        try {
            const response = await gradingService.deleteGrid(gridId)
            if (response.success) {
                setGrid(null)
                setGrids((prev) => prev.filter((g) => g.id !== gridId))
            } else {
                setError(
                    getGradingErrorMessage(
                        response.error ||
                            'An error occured when deleting the grid',
                        'delete_grid'
                    )
                )
            }
        } catch (err) {
            setError(getGradingErrorMessage(err as Error, 'delete_grid'))
        } finally {
            setSaving(false)
        }
    }, [])

    // Ajouter un critère
    const addCriterion = useCallback(
        (criterion: Omit<GradingCriterion, 'id'>) => {
            if (!grid) return

            const newCriterion: GradingCriterion = {
                ...criterion,
                id: `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            }

            setGrid((prev) =>
                prev
                    ? {
                          ...prev,
                          criteria: [...prev.criteria, newCriterion],
                      }
                    : null
            )
        },
        [grid]
    )

    // Mettre à jour un critère
    const updateCriterion = useCallback(
        (criterionId: string, updates: Partial<GradingCriterion>) => {
            if (!grid) return

            setGrid((prev) =>
                prev
                    ? {
                          ...prev,
                          criteria: prev.criteria.map((c) =>
                              c.id === criterionId ? { ...c, ...updates } : c
                          ),
                      }
                    : null
            )
        },
        [grid]
    )

    // Supprimer un critère
    const removeCriterion = useCallback(
        (criterionId: string) => {
            if (!grid) return

            setGrid((prev) =>
                prev
                    ? {
                          ...prev,
                          criteria: prev.criteria.filter(
                              (c) => c.id !== criterionId
                          ),
                          results: prev.results.filter(
                              (r) => r.gradingCriterionId !== criterionId
                          ),
                      }
                    : null
            )
        },
        [grid]
    )

    // Mettre à jour un résultat
    const updateResult = useCallback(
        (result: GradingResult) => {
            if (!grid) return

            setGrid((prev) =>
                prev
                    ? {
                          ...prev,
                          results: [
                              ...prev.results.filter(
                                  (r) =>
                                      r.gradingCriterionId !==
                                      result.gradingCriterionId
                              ),
                              result,
                          ],
                      }
                    : null
            )
        },
        [grid]
    )

    // Effacer l'erreur
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Chargement initial
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

    return {
        // État
        grid,
        grids,
        loading,
        saving,
        error,
        stats,

        // Actions
        loadGrid,
        loadGridByTarget,
        loadProjectGrids,
        createGrid,
        updateGrid,
        saveResults,
        validateGrid,
        deleteGrid,

        // Utilitaires
        addCriterion,
        updateCriterion,
        removeCriterion,
        updateResult,
        clearError,

        // Validation
        isGridComplete,
        isResultsComplete,
        canValidate,
        missingFields,
        missingCriteria,
    }
}
