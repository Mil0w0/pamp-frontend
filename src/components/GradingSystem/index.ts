// Composants principaux du système de notation
export { GradingGridForm } from './GradingGridForm'
export { GradingForm } from './GradingForm'
export { GradingGridList } from './GradingGridList'
export { GradingResults } from './GradingResults'
export { GradingSystemDemo } from './GradingSystemDemo'

// Types et interfaces
export type {
    GradingCriterion,
    GradingResult,
    GradingGrid,
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingApiResponse,
    GradingStats,
    GradingTarget,
    GradingGridType,
    NotationMode,
} from '@/types/grading'

// Services
export { gradingService } from '@/services/GradingService/grading-api-client'

// Hooks
export { useGradingGrid } from '@/hooks/useGradingGrid'

// Utilitaires
export {
    calculateGradingStats,
    validateGridCompleteness,
    validateResultsCompleteness,
    formatScore,
    formatPercentage,
    calculateFinalGrade,
    canValidateGrid,
    generateCriterionId,
} from '@/utils/gradingCalculations'
