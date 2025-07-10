export type RuleParameters =
    | string
    | number
    | boolean
    | string[]
    | RuleParameters[]
    | { [key: string]: RuleParameters }

export type ConformityRules = {
    name: string
    params: Record<string, RuleParameters>
}

export type SubmissionErrorDetail = {
    code: string
    message: string
    errors: {
        code: string
        check_index: number
        file_pattern: string
        total_files_checked: number
        message: string
        failed_files: {
            file: string
            reason: string
            case_sensitive: boolean
        }[]
    }[]
}

export type RuleParameterType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'array of strings'
    | 'array of objects'
    | 'integer'

export type RuleParameter = {
    type: RuleParameterType
    description: string
    required?: boolean
    examples?: (string | number | boolean)[]
    items?: { [key: string]: RuleParameter } // for array of objects
    default?: string | number | boolean
}

export type AvailableRule = {
    name: string
    description: string
    parameters: { [paramName: string]: RuleParameter }
}
