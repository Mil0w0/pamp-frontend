import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.tsx'
import { useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator.tsx'
import { RuleForm } from '@/components/ProjectPages/ConformityRules/RulesInputList.tsx'
import { submissionService } from '@/services/SubmissionService/submission-api-client.ts'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import {
    AvailableRule,
    ConformityRules,
} from '@/components/ProjectPages/ConformityRules/types.ts'
import { Step } from '@/components/ProjectPages/types.ts'
import { Button } from '@/components/ui/button.tsx'

export function StepSubmissionConformityRulesModal({
    step,
    stepIndex,
    handleStepChange,
}: {
    step: Partial<Step>
    stepIndex: number
    handleStepChange: (
        index: number,
        field: keyof Step,
        value: string | boolean | ConformityRules[]
    ) => void
}) {
    const [openModal, setOpenModal] = useState(false)
    const [availableRules, setAvailableRules] = useState<AvailableRule[]>([])
    const [selectedRules, setSelectedRules] = useState<ConformityRules[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const loadAvailableRules = async () => {
            setIsLoading(true)
            try {
                const response = await submissionService.getAvailableRules()
                if (response.success) {
                    if (response.data) {
                        setAvailableRules(response.data.available_rules)
                        console.log(response.data)
                    }
                } else {
                    toast.error(response.error)
                }
            } catch (error) {
                toast.error('Error : Error while fetching rules')
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadAvailableRules()
    }, [])

    const handleSave = () => {
        handleStepChange(stepIndex, 'submissionConformityRules', selectedRules)
        setOpenModal(false)
    }

    if (isLoading) {
        return <LoadingSpinner />
    }
    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
                <p className="text-sm underline cursor-pointer">
                    Apply conformity rules to the submission
                </p>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] flex flex-col ">
                <DialogHeader>
                    <DialogTitle>
                        Apply rules of conformity to this step's submissions
                    </DialogTitle>
                    <DialogDescription>
                        You can apply rules that will be used to check the
                        conformity of the archive or github repository
                        submitted. You can select multiple rules. Don't forget
                        to save you changes on the main page.
                    </DialogDescription>
                    <Separator className="mt-4" />
                </DialogHeader>
                <div className="overflow-y-auto pr-2">
                    <Button onClick={handleSave} size="sm" className="mb-4">
                        Save rules
                    </Button>
                    <RuleForm
                        rules={availableRules}
                        onChange={setSelectedRules}
                        defaultValues={step.submissionConformityRules || []}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default StepSubmissionConformityRulesModal
