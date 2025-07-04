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

type StepBoxProps = {
    step: Partial<Step>
    index: number
    handleStepChange?: (
        index: number,
        field: keyof Step,
        value: string | boolean
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

            <div className="space-y-4">
                <div className="grid gap-2 w-2/3">
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

                <div className="grid gap-2  w-2/3">
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

                <div className="grid gap-2  w-2/3">
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
                                e.target.value //todo: to iso
                            )
                        }
                        placeholder="YYYY-MM-DDTHH:MM"
                        type="datetime-local"
                    />
                </div>

                {!isStudent && (
                    <>
                        <div className="flex items-center gap-4 w-2/3">
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
        </div>
    )
}
