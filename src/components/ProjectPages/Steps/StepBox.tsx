import { Step } from '@/components/ProjectPages/types.ts'
import { TrashIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { DateTime } from 'luxon'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import StepSubmissionConformityRulesModal from '@/components/ProjectPages/ConformityRules/StepSubmissionConformityRulesModal.tsx'
import { ConformityRules } from '@/components/ProjectPages/ConformityRules/types.ts'
import { Badge } from '@/components/ui/badge.tsx'

type StepBoxProps = {
    step: Partial<Step>
    index: number
    handleStepChange?: (
        index: number,
        field: keyof Step,
        value: string | boolean | ConformityRules[]
    ) => void
    removeItem?: (index: number) => void
}

export function StepBox({
    step,
    index,
    handleStepChange = () => console.log(),
    removeItem = () => console.log(),
}: StepBoxProps) {
    const { currentUser } = useSelector((state: RootState) => state.user)
    const isStudent = currentUser?.role === 'STUDENT'
    return (
        <div className="space-y-6 rounded-xl border p-6 shadow-sm bg-white dark:bg-muted w-full">
            <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                    {step.name ? `Step: ${step.name}` : `Step ${index}`}
                </h2>
                {!isStudent && (
                    <TrashIcon
                        className="cursor-pointer text-primary hover:text-primary-foreground"
                        onClick={() => removeItem(index)}
                    />
                )}
            </div>

            <Separator />

            <div className="flex justify-between">
                <div className="space-y-4 w-1/3">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={step.name}
                            readOnly={isStudent}
                            onChange={(e) =>
                                handleStepChange(
                                    index,
                                    e.target.id as keyof Step,
                                    e.target.value
                                )
                            }
                            placeholder="Step name"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={step.description}
                            readOnly={isStudent}
                            onChange={(e) =>
                                handleStepChange(
                                    index,
                                    e.target.id as keyof Step,
                                    e.target.value
                                )
                            }
                            placeholder="Step description"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="submissionDeadLine">Deadline</Label>
                        <Input
                            readOnly={isStudent}
                            id="submissionDeadLine"
                            value={
                                step.submissionDeadLine
                                    ? DateTime.fromISO(
                                          step.submissionDeadLine
                                      ).toFormat("yyyy-MM-dd'T'HH:mm")
                                    : ''
                            }
                            onChange={(e) =>
                                handleStepChange(
                                    index,
                                    e.target.id as keyof Step,
                                    e.target.value
                                )
                            }
                            placeholder="YYYY-MM-DDTHH:MM"
                            type="datetime-local"
                        />
                    </div>

                    {!isStudent && (
                        <>
                            <div className="flex items-center gap-4 ">
                                <Label htmlFor="hasMandatorySubmission">
                                    Groups must make a submission for this step
                                </Label>
                                <Switch
                                    id="hasMandatorySubmission"
                                    checked={step.hasMandatorySubmission}
                                    onCheckedChange={() =>
                                        handleStepChange(
                                            index,
                                            'hasMandatorySubmission',
                                            !step.hasMandatorySubmission
                                        )
                                    }
                                />
                            </div>

                            <div className="flex items-center gap-4 w-2/3">
                                <Label htmlFor="allowSubmittingAfterDeadLine">
                                    Allow Submissions After Deadline
                                </Label>
                                <Switch
                                    id="allowSubmittingAfterDeadLine"
                                    checked={step.allowSubmittingAfterDeadLine}
                                    onCheckedChange={() =>
                                        handleStepChange(
                                            index,
                                            'allowSubmittingAfterDeadLine',
                                            !step.allowSubmittingAfterDeadLine
                                        )
                                    }
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="w-full md:w-1/3 space-y-4">
                    <Label className="text-base font-semibold">
                        Submission Rules
                    </Label>

                    {step.submissionConformityRules &&
                    step.submissionConformityRules.length > 0 ? (
                        <div className="space-y-3">
                            {step.submissionConformityRules.map(
                                (rule, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border p-4 shadow-sm bg-white dark:bg-muted space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Rule {index + 1}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {rule.name}
                                            </Badge>
                                        </div>

                                        {Object.entries(rule.params).length >
                                        0 ? (
                                            <div className="text-sm space-y-1">
                                                {Object.entries(
                                                    rule.params
                                                ).map(([key, value]) => {
                                                    const isPrimitive =
                                                        typeof value ===
                                                            'string' ||
                                                        typeof value ===
                                                            'number' ||
                                                        typeof value ===
                                                            'boolean'

                                                    return isPrimitive ? (
                                                        <div
                                                            key={key}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span className="text-muted-foreground">
                                                                {key}
                                                            </span>
                                                            <span className="font-medium">
                                                                {String(value)}
                                                            </span>
                                                        </div>
                                                    ) : null // skip complex values
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                No parameters specified.
                                            </p>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            There are no rules applied on submissions.
                        </div>
                    )}
                    {!isStudent && step.hasMandatorySubmission && (
                        <StepSubmissionConformityRulesModal
                            step={step}
                            stepIndex={index}
                            handleStepChange={handleStepChange}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
