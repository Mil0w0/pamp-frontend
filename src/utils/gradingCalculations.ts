import {
    GradingCriterion,
    GradingResult,
    GradingStats,
    GradingGrid,
} from '@/types/grading'

/**
 * Calcule les statistiques de notation pour un ensemble de résultats
 */
export const calculateGradingStats = (
    criteria: GradingCriterion[] = [],
    results: GradingResult[] = []
): GradingStats => {
    let totalScore = 0
    let maxScore = 0
    let weightedScore = 0
    let totalWeight = 0
    ;(criteria || []).forEach(
        (criterion: { id: string; maxPoints: number; weight: number }) => {
            const result = Array.isArray(results)
                ? results.find((r) => r.gradingCriterionId === criterion.id)
                : undefined
            const score = result?.score || 0

            totalScore += score
            maxScore += criterion.maxPoints
            weightedScore += (score / criterion.maxPoints) * criterion.weight
            totalWeight += criterion.weight
        }
    )

    const percentage = maxScore > 0 ? totalScore / maxScore : 0
    const finalWeightedScore = totalWeight > 0 ? weightedScore / totalWeight : 0

    return {
        totalScore,
        maxScore,
        percentage: Math.round(percentage * 100),
        weightedScore: Math.round(finalWeightedScore * 100),
    }
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
    ;(criteria || []).forEach((criterion: GradingCriterion) => {
        const result = Array.isArray(results)
            ? results.find((r) => r.gradingCriterionId === criterion.id)
            : undefined
        if (!result || result.score === void 0 || result.score === null) {
            missingCriteria.push(criterion.label)
        }
    })

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

/**
 * Génère un ID unique pour un nouveau critère
 */
export const generateCriterionId = (): string => {
    return `criterion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
