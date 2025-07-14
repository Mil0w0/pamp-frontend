import { Project } from '@/components/ManageProjects/types.ts'
import { ProjectGroup, Step } from '@/components/ProjectPages/types.ts'

export type ApiErrorMessage = {
    message: string
    statusCode: number
    error: string
}
export type ProjectApiResponse = {
    error?: string
    success: boolean
    data?: Project | Project[]
}

export type GroupApiResponse = {
    error?: string
    success: boolean
    data?: ProjectGroup | ProjectGroup[]
}
export type OralApiResponse = {
    error?: string
    success: boolean
    data?: OralDTO[]
}
export type StepApiResponse = {
    error?: string
    success: boolean
    data?: Step
}

// Report Definition Types
export type ReportDefinitionFormat = 'CLASSIC' | 'QUESTIONNAIRE'

export interface ReportDefinitionQuestion {
    id: string
    text: string
}

export interface ReportDefinition {
    id?: string
    projectId: string
    isActive: boolean
    format: ReportDefinitionFormat
    instruction?: string
    questions?: ReportDefinitionQuestion[]
}

export interface UpsertReportDefinitionDto {
    isActive: boolean
    format: ReportDefinitionFormat
    instruction?: string
    questions?: string // JSON string in API
}

export type ReportDefinitionApiResponse = {
    error?: string
    success: boolean
    data?: ReportDefinition
}

export type OralDTO = {
    id?: string
    startTime: string
    endTime: string
    groupId?: string
}
