import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { CheckCircle2, Save } from 'lucide-react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import {
    GradingScale,
    GradingCriterion,
    CreateGradingResultDto,
    GradingResultItemDto,
    GradingResult,
} from '@/components/GradingSystem/type'
import { toast } from 'sonner'

interface GradingInterfaceProps {
    gradingScale: GradingScale
    targetGroupId?: string
    targetStudentId?: string
    onGradingComplete?: () => void
    onCancel?: () => void
}

interface CriterionGrade {
    criterionId: string
    score: number
    comment: string
    maxPoints: number
    label: string
    commentEnabled: boolean
}

export function GradingInterface({
    gradingScale,
    targetGroupId,
    targetStudentId,
    onGradingComplete,
    onCancel,
}: GradingInterfaceProps) {
    const [grades, setGrades] = useState<CriterionGrade[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [existingResults, setExistingResults] = useState<GradingResult[]>([])
    const [isValidated, setIsValidated] = useState(false)

    useEffect(() => {
        // Initialize grades from criteria
        if (gradingScale.criteria) {
            const initialGrades = gradingScale.criteria.map((criterion) => ({
                criterionId: criterion.id,
                score: 0,
                comment: '',
                maxPoints: criterion.maxPoints,
                label: criterion.label,
                commentEnabled: criterion.commentEnabled,
            }))
            setGrades(initialGrades)
        }

        // Load existing results if any
        loadExistingResults()
        setIsValidated(gradingScale.isValidated)
    }, [gradingScale])

    const loadExistingResults = async () => {
        try {
            const results = await gradingService.getGradingResults(
                gradingScale.id
            )
            const filteredResults = results.filter(
                (result) =>
                    (targetGroupId && result.targetGroupId === targetGroupId) ||
                    (targetStudentId &&
                        result.targetStudentId === targetStudentId)
            )

            if (filteredResults.length > 0) {
                setExistingResults(filteredResults)
                // Update grades with existing results
                setGrades((prevGrades) =>
                    prevGrades.map((grade) => {
                        const existingResult = filteredResults.find(
                            (r) => r.gradingCriterionId === grade.criterionId
                        )
                        if (existingResult) {
                            return {
                                ...grade,
                                score: existingResult.score,
                                comment: existingResult.comment || '',
                            }
                        }
                        return grade
                    })
                )
            }
        } catch (error) {
            console.error('Error loading existing results:', error)
        }
    }

    const updateGrade = (
        criterionId: string,
        field: 'score' | 'comment',
        value: number | string
    ) => {
        setGrades((prevGrades) =>
            prevGrades.map((grade) =>
                grade.criterionId === criterionId
                    ? { ...grade, [field]: value }
                    : grade
            )
        )
    }

    const calculateTotalScore = () => {
        if (!gradingScale.criteria) return 0

        let totalWeightedScore = 0
        let totalWeight = 0

        grades.forEach((grade) => {
            const criterion = gradingScale.criteria?.find(
                (c) => c.id === grade.criterionId
            )
            if (criterion) {
                const weight = criterion.weight || 1
                const normalizedScore = (grade.score / grade.maxPoints) * 100
                totalWeightedScore += normalizedScore * weight
                totalWeight += weight
            }
        })

        return totalWeight > 0
            ? Math.round(totalWeightedScore / totalWeight)
            : 0
    }

    const isGradingComplete = () => {
        return grades.every((grade) => {
            const criterion = gradingScale.criteria?.find(
                (c) => c.id === grade.criterionId
            )
            const hasScore = grade.score >= 0 && grade.score <= grade.maxPoints
            const hasRequiredComment =
                !criterion?.commentEnabled || grade.comment.trim() !== ''
            return hasScore && hasRequiredComment
        })
    }

    const handleSaveGrades = async () => {
        if (!isGradingComplete()) {
            toast.error('Please complete all required fields before saving')
            return
        }

        setIsLoading(true)
        try {
            const results: GradingResultItemDto[] = grades.map((grade) => ({
                gradingCriterionId: grade.criterionId,
                score: grade.score,
                comment: grade.comment.trim() || undefined,
            }))

            const dto: CreateGradingResultDto = {
                targetGroupId,
                targetStudentId,
                results,
            }

            await gradingService.createResults(gradingScale.id, dto)
            toast.success('Grades saved successfully')
            onGradingComplete?.()
        } catch (error) {
            console.error('Error saving grades:', error)
            toast.error('Failed to save grades')
        } finally {
            setIsLoading(false)
        }
    }

    const handleValidateScale = async () => {
        if (!isGradingComplete()) {
            toast.error('Please complete all grading before validating')
            return
        }

        setIsLoading(true)
        try {
            await gradingService.validateGradingScale(gradingScale.id)
            setIsValidated(true)
            toast.success('Grading scale validated successfully')
            onGradingComplete?.()
        } catch (error) {
            console.error('Error validating grading scale:', error)
            toast.error('Failed to validate grading scale')
        } finally {
            setIsLoading(false)
        }
    }

    const getScoreColor = (score: number, maxPoints: number) => {
        const percentage = (score / maxPoints) * 100
        if (percentage >= 80) return 'text-green-600'
        if (percentage >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    if (isValidated && existingResults.length > 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Grading Complete - {gradingScale.title}
                    </CardTitle>
                    <CardDescription>
                        This grading has been validated and is now read-only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-4">
                            <Badge variant="default">Validated</Badge>
                            <Badge variant="outline">
                                Total Score: {calculateTotalScore()}%
                            </Badge>
                        </div>

                        {grades.map((grade) => {
                            const criterion = gradingScale.criteria?.find(
                                (c) => c.id === grade.criterionId
                            )
                            return (
                                <div
                                    key={grade.criterionId}
                                    className="border rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium">
                                            {grade.label}
                                        </h4>
                                        <span
                                            className={`font-bold ${getScoreColor(grade.score, grade.maxPoints)}`}
                                        >
                                            {grade.score}/{grade.maxPoints}
                                        </span>
                                    </div>
                                    {grade.comment && (
                                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                                            <strong>Comment:</strong>{' '}
                                            {grade.comment}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {onCancel && (
                            <Button onClick={onCancel} variant="outline">
                                Close
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{gradingScale.title}</CardTitle>
                <CardDescription>
                    Grade each criterion below. Total Score:{' '}
                    {calculateTotalScore()}%
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {grades.map((grade) => {
                        const criterion = gradingScale.criteria?.find(
                            (c) => c.id === grade.criterionId
                        )
                        return (
                            <div
                                key={grade.criterionId}
                                className="border rounded-lg p-4 space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">
                                        {grade.label}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Max: {grade.maxPoints}
                                        </span>
                                        {criterion?.weight && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Weight: {criterion.weight}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Score</Label>
                                            <span
                                                className={`font-bold ${getScoreColor(grade.score, grade.maxPoints)}`}
                                            >
                                                {grade.score}/{grade.maxPoints}
                                            </span>
                                        </div>
                                        <Slider
                                            value={[grade.score]}
                                            onValueChange={(value) =>
                                                updateGrade(
                                                    grade.criterionId,
                                                    'score',
                                                    value[0]
                                                )
                                            }
                                            max={grade.maxPoints}
                                            min={0}
                                            step={0.5}
                                            className="cursor-pointer"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>0</span>
                                            <span>{grade.maxPoints}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Precise Score</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={grade.maxPoints}
                                            step={0.5}
                                            value={grade.score}
                                            onChange={(e) => {
                                                const value = parseFloat(
                                                    e.target.value
                                                )
                                                if (
                                                    !isNaN(value) &&
                                                    value >= 0 &&
                                                    value <= grade.maxPoints
                                                ) {
                                                    updateGrade(
                                                        grade.criterionId,
                                                        'score',
                                                        value
                                                    )
                                                }
                                            }}
                                            className="w-32"
                                        />
                                    </div>

                                    {grade.commentEnabled && (
                                        <div className="space-y-2">
                                            <Label>
                                                Comment{' '}
                                                {criterion?.commentEnabled
                                                    ? '(Required)'
                                                    : '(Optional)'}
                                            </Label>
                                            <Textarea
                                                value={grade.comment}
                                                onChange={(e) =>
                                                    updateGrade(
                                                        grade.criterionId,
                                                        'comment',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter your feedback..."
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={handleSaveGrades}
                            disabled={isLoading || !isGradingComplete()}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? 'Saving...' : 'Save Grades'}
                        </Button>

                        {!isValidated && (
                            <Button
                                onClick={handleValidateScale}
                                disabled={isLoading || !isGradingComplete()}
                                variant="default"
                            >
                                {isLoading
                                    ? 'Validating...'
                                    : 'Validate & Finalize'}
                            </Button>
                        )}

                        {onCancel && (
                            <Button onClick={onCancel} variant="outline">
                                Cancel
                            </Button>
                        )}
                    </div>

                    {!isGradingComplete() && (
                        <div className="text-sm text-muted-foreground mt-2">
                            Please complete all required fields to enable saving
                            and validation.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default GradingInterface
