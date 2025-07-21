import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { CheckCircle2, Save } from 'lucide-react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import { GradingGrid, GradingResult, GradingCriterion } from '@/types/grading'
import { toast } from 'sonner'
import { FixedSizeList as List } from 'react-window'
import {
    calculateGradingStats,
    calculateFinalGrade,
} from '@/utils/gradingCalculations'

interface GradingInterfaceProps {
    gradingScale: GradingGrid
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

const CriterionRow = memo(
    ({
        grade,
        updateGrade,
        getScoreColor,
        criterion,
    }: {
        grade: CriterionGrade
        updateGrade: (
            criterionId: string,
            field: 'score' | 'comment',
            value: number | string
        ) => void
        getScoreColor: (score: number, maxPoints: number) => string
        criterion?: GradingCriterion
    }) => (
        <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-medium">{grade.label}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Max: {grade.maxPoints}
                    </span>
                    {criterion?.weight && (
                        <Badge variant="outline" className="text-xs">
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
                            className={`font-bold ${getScoreColor(
                                grade.score,
                                grade.maxPoints
                            )}`}
                        >
                            {grade.score}/{grade.maxPoints}
                        </span>
                    </div>
                    <Slider
                        value={[grade.score]}
                        onValueChange={(value) =>
                            updateGrade(grade.criterionId, 'score', value[0])
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
                            const value = parseFloat(e.target.value)
                            if (
                                !isNaN(value) &&
                                value >= 0 &&
                                value <= grade.maxPoints
                            ) {
                                updateGrade(grade.criterionId, 'score', value)
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
                            placeholder="Add a comment..."
                            rows={3}
                        />
                    </div>
                )}
            </div>
        </div>
    )
)

export function GradingInterface({
    gradingScale,
    targetGroupId,
    targetStudentId,
    onGradingComplete,
    onCancel,
}: GradingInterfaceProps) {
    const [grades, setGrades] = useState<CriterionGrade[]>(() => {
        return gradingScale.criteria.map((criterion: GradingCriterion) => ({
            criterionId: criterion.id,
            score: 0,
            comment: '',
            maxPoints: criterion.maxPoints,
            label: criterion.label,
            commentEnabled: criterion.commentEnabled || false,
        }))
    })
    const [isLoading, setIsLoading] = useState(false)
    const [existingResults, setExistingResults] = useState<GradingResult[]>([])
    const [isValidated, setIsValidated] = useState(false)

    const loadExistingResults = useCallback(async () => {
        try {
            const targetId = targetStudentId || targetGroupId
            if (!targetId) return

            const response = await gradingService.getGrid(gradingScale.id)
            if (
                response.success &&
                response.data &&
                !Array.isArray(response.data) &&
                response.data.results
            ) {
                const gridResults = response.data.results.filter(
                    (result: GradingResult) =>
                        result.targetStudentId === targetStudentId ||
                        result.targetGroupId === targetGroupId
                )
                setExistingResults(gridResults)

                setGrades((prevGrades) =>
                    prevGrades.map((grade) => {
                        const existingResult = gridResults.find(
                            (result: GradingResult) =>
                                result.gradingCriterionId === grade.criterionId
                        )
                        if (existingResult) {
                            const clampedScore = Math.max(
                                0,
                                Math.min(
                                    grade.maxPoints,
                                    existingResult.score || 0
                                )
                            )
                            return {
                                ...grade,
                                score: clampedScore,
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
    }, [gradingScale.id, targetStudentId, targetGroupId])

    useEffect(() => {
        loadExistingResults()
    }, [loadExistingResults])

    const updateGrade = useCallback(
        (
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
        },
        []
    )

    const calculateTotalScore = useMemo(() => {
        if (!gradingScale.criteria) return 0

        let totalWeightedScore = 0
        let totalWeight = 0

        grades.forEach((grade) => {
            const criterion = gradingScale.criteria?.find(
                (c: { id: string }) => c.id === grade.criterionId
            )
            if (criterion) {
                const weight = criterion.weight || 1
                const clampedScore = Math.max(
                    0,
                    Math.min(grade.maxPoints, grade.score)
                )
                const normalizedScore = (clampedScore / grade.maxPoints) * 100
                totalWeightedScore += normalizedScore * weight
                totalWeight += weight
            }
        })

        return totalWeight > 0
            ? Math.round(totalWeightedScore / totalWeight)
            : 0
    }, [gradingScale.criteria, grades])

    const isGradingComplete = useMemo(() => {
        return grades.every((grade) => {
            const criterion = gradingScale.criteria?.find(
                (c: { id: string }) => c.id === grade.criterionId
            )
            const hasScore = grade.score >= 0 && grade.score <= grade.maxPoints
            const hasRequiredComment =
                !criterion?.commentEnabled || grade.comment.trim() !== ''
            return hasScore && hasRequiredComment
        })
    }, [grades, gradingScale.criteria])

    const completedCriteria = useMemo(() => {
        return grades.filter((grade) => {
            const criterion = gradingScale.criteria?.find(
                (c: { id: string }) => c.id === grade.criterionId
            )
            const hasScore = grade.score >= 0 && grade.score <= grade.maxPoints
            const hasRequiredComment =
                !criterion?.commentEnabled || grade.comment.trim() !== ''
            return hasScore && hasRequiredComment
        }).length
    }, [grades, gradingScale.criteria])

    const handleSaveGrades = useCallback(async () => {
        if (!isGradingComplete) {
            toast.error('Please complete all required fields before saving')
            return
        }

        setIsLoading(true)
        try {
            // Fetch the latest grid to get current valid criteria
            const latestResponse = await gradingService.getGrid(
                gradingScale.id,
                true
            )
            if (
                !latestResponse.success ||
                !latestResponse.data ||
                !('criteria' in latestResponse.data) ||
                !Array.isArray(latestResponse.data.criteria)
            ) {
                throw new Error('Failed to fetch latest grading grid')
            }
            const latestCriteria = latestResponse.data.criteria

            const validCriterionIds = new Set(
                latestCriteria.map((c: { id: unknown }) => c.id)
            )

            const results = grades
                .filter((grade) => validCriterionIds.has(grade.criterionId))
                .map((grade) => ({
                    gradingCriterionId: grade.criterionId,
                    targetStudentId,
                    targetGroupId,
                    score: Math.max(0, Math.min(grade.maxPoints, grade.score)),
                    comment: grade.comment,
                }))

            console.log(
                'Latest Valid Criterion IDs:',
                Array.from(validCriterionIds)
            )
            console.log('Results being sent:', JSON.stringify(results, null, 2))

            if (results.length < grades.length) {
                toast.warning(
                    `${grades.length - results.length} criteria were filtered out due to updates in the grading scale.`
                )
            }

            const response = await gradingService.validateGridWorkflow(
                gradingScale.id,
                results
            )
            if (response.success) {
                setIsValidated(true)
                toast.success('Grading completed and validated successfully')
                onGradingComplete?.()
            } else {
                throw new Error(
                    response.error || 'Failed to save and validate grades'
                )
            }
        } catch (error) {
            console.error('Error saving and validating grades:', error)
            toast.error('Failed to save and validate grades')
        } finally {
            setIsLoading(false)
        }
    }, [
        isGradingComplete,
        grades,
        gradingScale.id,
        targetStudentId,
        targetGroupId,
        onGradingComplete,
    ])

    const getScoreColor = useCallback((score: number, maxPoints: number) => {
        const clampedScore = Math.max(0, Math.min(maxPoints, score))
        const percentage = (clampedScore / maxPoints) * 100
        if (percentage >= 80) return 'text-green-600'
        if (percentage >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }, [])

    const overallStats = useMemo(() => {
        const stats = calculateGradingStats(
            gradingScale.criteria,
            existingResults
        )
        const finalGrade = calculateFinalGrade(
            gradingScale.criteria,
            existingResults
        )
        const completion = `${existingResults.length}/${gradingScale.criteria?.length || 1}`
        const generalComment = grades
            .filter((g) => g.comment)
            .map((g) => `${g.label}: ${g.comment}`)
            .join('\n')
        return {
            progress: completion,
            currentScore: `${stats.totalScore}/${stats.maxScore}`,
            percentage: `${stats.percentage}%`,
            gradeOutOf20: finalGrade,
            status: 'Validated',
            score: stats.totalScore,
            generalComment,
        }
    }, [gradingScale, existingResults, grades])

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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <Label>Progress</Label>
                                <p>{overallStats.progress}</p>
                            </div>
                            <div>
                                <Label>Current Score</Label>
                                <p>{overallStats.currentScore}</p>
                            </div>
                            <div>
                                <Label>Percentage</Label>
                                <p>{overallStats.percentage}</p>
                            </div>
                            <div>
                                <Label>Grade out of 20</Label>
                                <p>{overallStats.gradeOutOf20}</p>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <p>{overallStats.status}</p>
                            </div>
                            <div>
                                <Label>Score</Label>
                                <p>{overallStats.score}</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <Label>General Comment</Label>
                            <p className="p-2 bg-muted rounded text-sm">
                                {overallStats.generalComment ||
                                    'No general comment'}
                            </p>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <Badge variant="default">Validated</Badge>
                            <Badge variant="outline">
                                Total Score: {overallStats.percentage}
                            </Badge>
                        </div>

                        {grades.map((grade) => (
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
                        ))}

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
                    {calculateTotalScore}%
                </CardDescription>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                            {completedCriteria}/{grades.length} criteria
                            completed
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                isGradingComplete
                                    ? 'bg-green-500'
                                    : 'bg-primary'
                            }`}
                            style={{
                                width: `${(completedCriteria / grades.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <List
                        height={500}
                        itemCount={grades.length}
                        itemSize={200}
                        width="100%"
                    >
                        {({ index, style }) => {
                            const grade = grades[index]
                            const criterion = gradingScale.criteria?.find(
                                (c) => c.id === grade.criterionId
                            )
                            return (
                                <div style={style}>
                                    <CriterionRow
                                        grade={grade}
                                        updateGrade={updateGrade}
                                        getScoreColor={getScoreColor}
                                        criterion={criterion}
                                    />
                                </div>
                            )
                        }}
                    </List>

                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={handleSaveGrades}
                            disabled={isLoading || !isGradingComplete}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading
                                ? 'Saving...'
                                : 'Save & Complete Grading'}
                        </Button>

                        {onCancel && (
                            <Button onClick={onCancel} variant="outline">
                                Cancel
                            </Button>
                        )}
                    </div>

                    {!isGradingComplete && (
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
