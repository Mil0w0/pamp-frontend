export type RuleParameterDefinition =
    | {
          type: 'string' | 'number' | 'boolean' | 'integer'
          description: string
          required?: boolean
          default?: string | number | boolean
          examples?: (string | number | boolean)[]
      }
    | {
          type: 'array of strings'
          description: string
          required?: boolean
          examples?: string[]
      }
    | {
          type: 'array of objects'
          description: string
          required?: boolean
          items: {
              [key: string]: RuleParameterDefinition
          }
      }

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
    examples?: any[]
    items?: { [key: string]: RuleParameter } // for array of objects
    default?: any
}

export type AvailableRule = {
    name: string
    description: string
    parameters: { [paramName: string]: RuleParameter }
}
