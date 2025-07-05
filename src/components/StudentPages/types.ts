import React from 'react'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { ReportDefinition } from '@/services/ProjectService/types.ts'

export interface StudentReportContentProps {
    projectId: string
    groupId: string
}

export interface QuestionProgress {
    questionId: string
    hasContent: boolean
    characterCount: number
}

export interface QuestionEditorProps {
    question: { id: string; text: string }
    index: number
    isDarkMode: boolean
    uploadFile: (file: File) => Promise<string>
    onProgressUpdate?: (questionId: string, progress: QuestionProgress) => void
}

export interface ReportData {
    project: Project | null
    group: ProjectGroup | null
    reportDefinition: ReportDefinition | null
    isLoading: boolean
    accessDenied: string | null
}

export interface SyncStatus {
    icon: React.ReactElement
    text: string
}

export type ReportStatus = 'draft' | 'submitted'
