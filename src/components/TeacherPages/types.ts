import React from 'react'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { ReportDefinition } from '@/services/ProjectService/types.ts'

export interface TeacherReviewReportContentProps {
    projectId: string
    groupId: string
}

export interface TeacherQuestionReviewProps {
    question: { id: string; text: string }
    index: number
    isDarkMode: boolean
    uploadFile: (file: File) => Promise<string>
}

export interface CustomCommentToolbarProps {
    editor: unknown | null
}

export interface TeacherReportData {
    project: Project | null
    group: ProjectGroup | null
    reportDefinition: ReportDefinition | null
    isLoading: boolean
}

export interface SyncStatus {
    icon: React.ReactElement
    text: string
}
