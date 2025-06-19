import { Project } from '@/components/ManageProjects/types.ts'

export type ProjectGroup = {
    id: string
    name: string
    reportSubmitted: boolean
    reportSubmittedDate: string
    studentsIds: string
    project: Project
}
