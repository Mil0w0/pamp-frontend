import { Project } from '@/components/ManageProjects/types.ts'
import { ConformityRules } from '@/components/ProjectPages/ConformityRules/types.ts'

export type ProjectGroup = {
    id: string
    name: string
    reportSubmitted: boolean
    reportSubmittedDate: string
    studentsIds: string
    project: Project
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
