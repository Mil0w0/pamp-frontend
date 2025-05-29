import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'

export type Project = {
    id: string
    name: string
    description: string
    isPublished: boolean
    createdAt: string
    studentBatch: StudentBatch
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
