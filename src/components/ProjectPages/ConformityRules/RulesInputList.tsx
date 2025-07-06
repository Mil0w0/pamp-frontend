export interface RuleParameter {
    type:
        | 'string'
        | 'number'
        | 'integer'
        | 'boolean'
        | 'array of strings'
        | 'array of objects'
    description?: string
    items?: Record<string, RuleParameter> // for 'array of objects'
}

export interface AvailableRule {
    name: string
    description: string
    parameters: Record<string, RuleParameter>
}

export interface ConformityRules {
    name: string
    params: Record<string, any>
}

// --- RuleForm.tsx
import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import RuleDescriptionTooltip from './RuleDescriptionTooltip'

interface RuleFormProps {
    rules: AvailableRule[]
    defaultValues?: ConformityRules[]
    onChange: (rules: ConformityRules[]) => void
}

export const RuleForm: React.FC<RuleFormProps> = ({
    rules,
    defaultValues = [],
    onChange,
}) => {
    const [selectedRules, setSelectedRules] = useState<Record<string, any>>(
        () => {
            const map: Record<string, any> = {}
            defaultValues.forEach((rule) => {
                map[rule.name] = rule.params
            })
            return map
        }
    )

    const [rawArrayInputs, setRawArrayInputs] = useState<
        Record<string, string>
    >({})

    useEffect(() => {
        const formatted: ConformityRules[] = Object.entries(selectedRules).map(
            ([name, params]) => ({ name, params })
        )
        onChange(formatted)
        console.log(formatted)
    }, [selectedRules])

    const handleToggle = (name: string) => {
        setSelectedRules((prev) => {
            const updated = { ...prev }
            if (name in updated) delete updated[name]
            else updated[name] = {}
            return updated
        })
    }

    const handleParamChange = (rule: string, path: string, value: any) => {
        setSelectedRules((prev) => {
            const updatedRule = { ...(prev[rule] || {}) }
            const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
            let target = updatedRule
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i]
                target[key] =
                    target[key] || (isNaN(Number(parts[i + 1])) ? {} : [])
                target = target[key]
            }
            target[parts.at(-1)!] = value
            return { ...prev, [rule]: updatedRule }
        })
    }

    const renderInput = (
        rule: string,
        name: string,
        param: RuleParameter,
        value: any
    ) => {
        const rawKey = `${rule}.${name}`
        const rawVal =
            rawArrayInputs[rawKey] ??
            (Array.isArray(value) ? value.join(', ') : '')

        switch (param.type) {
            case 'string':
            case 'number':
            case 'integer':
                return (
                    <Input
                        type={param.type === 'string' ? 'text' : 'number'}
                        value={value ?? ''}
                        onChange={(e) =>
                            handleParamChange(
                                rule,
                                name,
                                param.type === 'string'
                                    ? e.target.value
                                    : parseFloat(e.target.value)
                            )
                        }
                    />
                )
            case 'boolean':
                return (
                    <Checkbox
                        checked={!!value}
                        onCheckedChange={() =>
                            handleParamChange(rule, name, !value)
                        }
                    />
                )
            case 'array of strings':
                return (
                    <Textarea
                        value={rawVal}
                        onChange={(e) => {
                            const val = e.target.value
                            setRawArrayInputs((prev) => ({
                                ...prev,
                                [rawKey]: val,
                            }))
                            const parsed = val
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                            handleParamChange(rule, name, parsed)
                        }}
                    />
                )
            case 'array of objects':
                return (
                    <div className="space-y-2">
                        {(Array.isArray(value) ? value : [{}]).map(
                            (item, idx) => (
                                <div key={idx} className="border p-2 rounded">
                                    {param.items &&
                                        Object.entries(param.items).map(
                                            ([key, nested]) => (
                                                <div key={key}>
                                                    <Label className="my-2">
                                                        {key}
                                                    </Label>
                                                    {renderInput(
                                                        rule,
                                                        `${name}[${idx}].${key}`,
                                                        nested,
                                                        item?.[key] ?? ''
                                                    )}
                                                    <p className="text-xs text-gray-400 my-2">
                                                        {nested.description}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                </div>
                            )
                        )}
                        <p
                            onClick={() =>
                                handleParamChange(rule, name, [
                                    ...(value || [{}]),
                                    {},
                                ])
                            }
                            className="text-sm underline cursor-pointer"
                        >
                            + Add another
                        </p>
                    </div>
                )
            default:
                return <div>Unsupported type: {param.type}</div>
        }
    }

    return (
        <div className="grid gap-4">
            {rules.map((rule) => (
                <div key={rule.name} className="border p-4 rounded space-y-2">
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            checked={rule.name in selectedRules}
                            onCheckedChange={() => handleToggle(rule.name)}
                        />
                        <span className="text-lg">{rule.name}</span>
                        <RuleDescriptionTooltip message={rule.description} />
                    </Label>
                    {rule.name in selectedRules && (
                        <div className="ml-4 space-y-2">
                            {Object.entries(rule.parameters).map(
                                ([paramName, param]) => (
                                    <div key={paramName}>
                                        <Label className="my-2">
                                            {paramName}
                                        </Label>
                                        {renderInput(
                                            rule.name,
                                            paramName,
                                            param,
                                            selectedRules[rule.name]?.[
                                                paramName
                                            ]
                                        )}
                                        {param.description && (
                                            <p className="text-xs text-gray-400 my-2">
                                                {param.description}
                                            </p>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
