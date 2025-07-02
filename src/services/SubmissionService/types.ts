export type SubmissionDTO = {
    link: string
    link_type: string
    project_uuid: string
    group_uuid: string
    project_step: string
    rules: string[]
};

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
    detail: {
        validation_failed: boolean
        failed_rule_count: number
        total_rule_count: number
        errors: ValidationError[]
        summary: string
    }
}
export type ValidationError = {
    code: string
    errors: LocalError[]
    message: string
    rule_name: string
}
export type RuleResult = {
    message: string
    passed: boolean
    rule_name: string
}

type LocalError = {
    code: string
    missing_files: string[]
    patterns: string[]
    message: string
}

export enum SubmissionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REJECTED = 'rejected',
}
