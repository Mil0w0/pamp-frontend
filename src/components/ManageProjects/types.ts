import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'
import { ProjectGroup, Step } from '@/components/ProjectPages/types.ts'

export type Project = {
    id: string
    name: string
    description: string
    syllabusUrl: string
    isPublished: boolean
    createdAt: string
    studentBatch: StudentBatch
    maxGroups: number
    maxPerGroup: number
    minPerGroup: number
    groupsCreator: 'TEACHER' | 'STUDENT' | 'RANDOM'
    creationGroupDeadLineDate: string
    groups: ProjectGroup[]
    steps: Step[]
    creatorId: string
    oralsConfigEndTime: string
    oralsConfigStartTime: string
    oralsConfigDuration: number
}

export type CreateProjectDto = {
    name: string
    description: string
}

export type EditProjectDto = {
    name?: string
    description?: string
    syllabusUrl?: string
    isPublished?: boolean
    maxGroups?: number | null
    maxPerGroup?: number | null
    minPerGroup?: number | null
    groupsCreator?: 'TEACHER' | 'STUDENT' | 'RANDOM'
    creationGroupDeadLineDate?: string
    studentBatchId?: string
    oralsConfigEndTime?: string | null
    oralsConfigStartTime?: string | null
    oralsConfigDuration?: number | null
}
