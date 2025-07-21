import {
    GradingCriterion,
    GradingResult,
    GradingStats,
    GradingGrid,
} from '@/types/grading'

// Cache for statistics calculations
const statsCache = new Map<string, GradingStats>()

/**
 * Generate a cache key for statistics
 */
const getStatsCacheKey = (
    criteria: GradingCriterion[],
    results: GradingResult[]
): string => {
    const criteriaKey = Array.isArray(criteria)
        ? criteria.map((c) => `${c.id}:${c.maxPoints}:${c.weight}`).join('|')
        : ''
    const resultsKey = Array.isArray(results)
        ? results.map((r) => `${r.gradingCriterionId}:${r.score}`).join('|')
        : ''
    return `${criteriaKey}#${resultsKey}`
}

/**
 * Calculate grading statistics for a set of results
 */
export const calculateGradingStats = (
    criteria: GradingCriterion[] = [],
    results: GradingResult[] = []
): GradingStats => {
    // Vérifier le cache d'abord
    const cacheKey = getStatsCacheKey(criteria, results)
    const cached = statsCache.get(cacheKey)
    if (cached) {
        return cached
    }

    // Créer une Map pour un accès plus rapide aux résultats
    const resultsMap = new Map<string, number>()
    if (Array.isArray(results)) {
        results.forEach((result) => {
            resultsMap.set(result.gradingCriterionId, result.score || 0)
        })
    }

    let totalScore = 0
    let maxScore = 0
    let weightedScore = 0
    let totalWeight = 0
    let criteriaCount = 0

    const safeCriteria = Array.isArray(criteria) ? criteria : []
    for (const criterion of safeCriteria) {
        const rawScore = resultsMap.get(criterion.id) || 0
        const clampedScore = Math.max(
            0,
            Math.min(criterion.maxPoints, rawScore)
        )
        totalScore += clampedScore
        maxScore += criterion.maxPoints
        criteriaCount++

        const normalizedScore =
            criterion.maxPoints > 0 ? clampedScore / criterion.maxPoints : 0
        weightedScore += normalizedScore * criterion.weight
        totalWeight += criterion.weight
    }

    const percentage = maxScore > 0 ? totalScore / maxScore : 0
    const finalWeightedScore = totalWeight > 0 ? weightedScore / totalWeight : 0

    // Calculate simple average: sum of all scores divided by number of criteria
    const simpleAverage = criteriaCount > 0 ? totalScore / criteriaCount : 0

    const stats: GradingStats = {
        totalScore,
        maxScore,
        percentage: Math.round(percentage * 100),
        weightedScore: Math.round(finalWeightedScore * 100),
        simpleAverage: Math.round(simpleAverage * 100) / 100, // Round to 2 decimal places
    }

    // Mettre en cache le résultat (limiter la taille du cache)
    if (statsCache.size >= 50) {
        const firstKey = statsCache.keys().next().value
        if (firstKey) {
            statsCache.delete(firstKey)
        }
    }
    statsCache.set(cacheKey, stats)

    return stats
}

/**
 * Valide qu'une grille de notation est complète
 */
export const validateGridCompleteness = (
    grid: GradingGrid
): {
    isComplete: boolean
    missingFields: string[]
} => {
    const missingFields: string[] = []

    if (!grid.title?.trim()) {
        missingFields.push('Titre')
    }

    if (!grid.criteria || grid.criteria.length === 0) {
        missingFields.push('Critères de notation')
    } else {
        grid.criteria.forEach((criterion, index) => {
            if (!criterion.label?.trim()) {
                missingFields.push(`Libellé du critère ${index + 1}`)
            }
            if (criterion.maxPoints <= 0) {
                missingFields.push(`Points maximum du critère ${index + 1}`)
            }
            if (criterion.weight <= 0) {
                missingFields.push(`Poids du critère ${index + 1}`)
            }
        })
    }

    return {
        isComplete: missingFields.length === 0,
        missingFields,
    }
}

/**
 * Valide qu'une notation est complète pour tous les critères
 */
export const validateResultsCompleteness = (
    criteria: GradingCriterion[] = [],
    results: GradingResult[] = []
): {
    isComplete: boolean
    missingCriteria: string[]
} => {
    const missingCriteria: string[] = []

    // Créer une Map pour un accès plus rapide aux résultats
    const resultsMap = new Map<string, GradingResult>()
    if (Array.isArray(results)) {
        results.forEach((result) => {
            resultsMap.set(result.gradingCriterionId, result)
        })
    }

    // Utiliser for...of pour de meilleures performances
    for (const criterion of criteria || []) {
        const result = resultsMap.get(criterion.id)
        if (!result || result.score === undefined || result.score === null) {
            missingCriteria.push(criterion.label)
        }
    }

    return {
        isComplete: missingCriteria.length === 0,
        missingCriteria,
    }
}

/**
 * Formate un score avec sa note maximale
 */
export const formatScore = (score: number, maxScore: number): string => {
    return `${score}/${maxScore}`
}

/**
 * Formate un pourcentage
 */
export const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`
}

/**
 * Calcule la note finale pondérée sur 20
 */
export const calculateFinalGrade = (
    criteria: GradingCriterion[],
    results: GradingResult[],
    scale: number = 20
): number => {
    const stats = calculateGradingStats(criteria, results)
    return Math.round((stats.weightedScore / 100) * scale * 100) / 100
}

/**
 * Vérifie si une grille peut être validée
 */
export const canValidateGrid = (grid: GradingGrid): boolean => {
    const gridValidation = validateGridCompleteness(grid)
    const resultsValidation = validateResultsCompleteness(
        grid.criteria,
        grid.results
    )

    return gridValidation.isComplete && resultsValidation.isComplete
}

// Compteur pour générer des IDs uniques plus efficacement
let criterionIdCounter = 0

/**
 * Génère un ID unique pour un nouveau critère
 */
export const generateCriterionId = (): string => {
    criterionIdCounter += 1
    return `criterion_${Date.now()}_${criterionIdCounter.toString(36)}`
}

/**
 * Vide les caches pour libérer la mémoire
 */
export const clearCalculationCaches = (): void => {
    statsCache.clear()
}
