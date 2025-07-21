import { ReactNode } from 'react'

export interface GradingCriterion {
    [x: string]: ReactNode
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
    [x: string]: unknown
    id: string
    projectId: string
    type: GradingGridType
    targetId: string
    notationMode: NotationMode
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
    type: GradingGridType
    targetId: string
    notationMode: NotationMode
    title: string
    criteria: Omit<GradingCriterion, 'id'>[]
    generalComment?: string
}

export interface UpdateGradingGridDto {
    title?: string
    notationMode?: NotationMode
    criteria?: (Omit<GradingCriterion, 'id'> & { id?: string })[]
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
    simpleAverage: number
}

export interface GradingTarget {
    id: string
    name: string
    type: 'group' | 'student'
}

export type GradingGridType =
    | 'livrable'
    | 'rapport'
    | 'soutenance'
    | 'deliverable'
    | 'report'
    | 'presentation'
export type NotationMode = 'groupe' | 'individuel' | 'group' | 'individual'
