import { Project } from '@/components/ManageProjects/types.ts'
import { ConformityRules } from '@/components/ProjectPages/ConformityRules/types.ts'

export type ProjectGroup = {
    id: string
    name: string
    reportSubmitted: boolean
    reportSubmittedDate: string
    studentsIds: string
    project: Project
    oral: Oral | null
}

export type Step = {
    id: string
    name: string
    description: string
    submissionDeadLine: string
    hasMandatorySubmission: boolean
    allowSubmittingAfterDeadLine: boolean
    submissionConformityRules: ConformityRules[]
}

export type Oral = {
    id: string
    group: ProjectGroup
    startTime: string
    endTime: string
}
