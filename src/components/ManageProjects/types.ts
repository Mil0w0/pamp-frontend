import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'

export type Project = {
    id: string
    name: string
    description: string
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
}

export type ProjectGroup = {
    id: string
    name: string
    studentIds: string
}

export type Step = {
    id: string
    name: string
}

export type CreateProjectDto = {
    name: string
    description: string
}

export type EditProjectDto = {
    name?: string
    description?: string
    isPublished?: boolean
}
