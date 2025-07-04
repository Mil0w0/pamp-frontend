export type SubmissionDTO = {
    link: string
    link_type: string
    project_uuid: string
    group_uuid: string
    project_step: string
    rules: string[]
}
export type SubmissionResponse = {
    link: string
    link_type: string
    project_uuid: string
    group_uuid: string
    project_step: string
    created_at: string
    id: string
    status: SubmissionStatus
    submitted_by: string
    description?: number
    file_size_bytes?: number
    file_count?: number
    upload_date_time?: string
}

export type CreatedSubmissionResponse = {
    data: SubmissionResponse
    message: string
    rule_results: RuleResult[]
    submission_id: string
    success: true
}

export type ValidationFailedSubmissionResponse = {
    detail: ValidationError[]
}
export type ValidationError = {
    loc: string
    msg: string
    input: string
    type: string
}
export type RuleResult = {
    message: string
    passed: boolean
    rule_name: string
}

export enum SubmissionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REJECTED = 'rejected',
}
