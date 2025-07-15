export interface GradingCriterion {
    id: string
    label: string
    maxPoints: number
    weight: number
    commentEnabled: boolean
}

export interface GradingResult {
    gradingCriterionId: string
    targetGroupId?: string
    targetStudentId?: string
    score: number
    comment?: string
}

export interface GradingGrid {
    id: string
    projectId: string
    type: 'livrable' | 'rapport' | 'soutenance'
    targetId: string
    notationMode: 'groupe' | 'individuel'
    title: string
    isValidated: boolean
    validatedAt?: string
    criteria: GradingCriterion[]
    results: GradingResult[]
    generalComment?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateGradingGridDto {
    projectId: string
    type: 'livrable' | 'rapport' | 'soutenance'
    targetId: string
    notationMode: 'groupe' | 'individuel'
    title: string
    criteria: Omit<GradingCriterion, 'id'>[]
    generalComment?: string
}

export interface UpdateGradingGridDto {
    title?: string
    notationMode?: 'groupe' | 'individuel'
    criteria?: GradingCriterion[]
}

export interface GradingApiResponse {
    error?: string
    success: boolean
    data?: GradingGrid | GradingGrid[]
}

export interface GradingStats {
    totalScore: number
    maxScore: number
    percentage: number
    weightedScore: number
}

export interface GradingTarget {
    id: string
    name: string
    type: 'group' | 'student'
}

export type GradingGridType = 'livrable' | 'rapport' | 'soutenance'
export type NotationMode = 'groupe' | 'individuel'
