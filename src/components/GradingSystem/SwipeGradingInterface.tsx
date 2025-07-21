import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import {
    CheckCircle2,
    Save,
    X,
    Check,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import { GradingGrid, GradingResult, GradingCriterion } from '@/types/grading'
import { toast } from 'sonner'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface SwipeGradingInterfaceProps {
    gradingScale: GradingGrid
    targetGroupId?: string
    targetStudentId?: string
    onGradingComplete?: () => void
    onCancel?: () => void
    readOnly?: boolean
}

interface CriterionGrade {
    criterionId: string
    score: number
    comment: string
    maxPoints: number
    label: string
    commentEnabled: boolean
    isValidated: boolean
}

export function SwipeGradingInterface({
    gradingScale,
    targetGroupId,
    targetStudentId,
    onGradingComplete,
    onCancel,
    readOnly = false,
}: SwipeGradingInterfaceProps) {
    const [grades, setGrades] = useState<CriterionGrade[]>([])
    const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [, setExistingResults] = useState<GradingResult[]>([])
    const [isValidated, setIsValidated] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<
        'left' | 'right' | null
    >(null)
    const constraintsRef = useRef(null)

    const initialGrades = useMemo(() => {
        if (!gradingScale.criteria) return []
        return gradingScale.criteria.map((criterion: GradingCriterion) => ({
            criterionId: criterion.id,
            score: 0,
            comment: '',
            maxPoints: criterion.maxPoints,
            label: criterion.label,
            commentEnabled: criterion.commentEnabled,
            isValidated: false,
        }))
    }, [gradingScale.criteria])

    const loadExistingResults = useCallback(async () => {
        if ((readOnly || gradingScale.isValidated) && gradingScale.id) {
            try {
                const response = await gradingService.getGridResults(
                    gradingScale.id
                )
                if (response.success && Array.isArray(response.data)) {
                    const results = response.data as unknown as GradingResult[]
                    const mappedGrades = gradingScale.criteria.map(
                        (criterion) => {
                            const result = results.find(
                                (r) => r.gradingCriterionId === criterion.id
                            )
                            return {
                                criterionId: criterion.id ?? '',
                                score: result ? result.score : 0,
                                comment: result ? result.comment : '',
                                maxPoints: criterion.maxPoints ?? 0,
                                label: criterion.label ?? '',
                                commentEnabled:
                                    criterion.commentEnabled ?? false,
                                isValidated: !!result,
                            }
                        }
                    )
                    setGrades(
                        mappedGrades.map((grade) => ({
                            ...grade,
                            comment: grade.comment || '',
                        }))
                    )
                    setExistingResults(results)
                } else {
                    setGrades(initialGrades)
                    setExistingResults([])
                }
            } catch (error) {
                setGrades(initialGrades)
                setExistingResults([])
                console.log(error)
            }
        } else if (grades.length === 0) {
            setGrades(initialGrades)
        }
        setIsValidated(gradingScale.isValidated)
    }, [
        gradingScale.id,
        gradingScale.isValidated,
        readOnly,
        initialGrades,
        gradingScale.criteria,
        setGrades,
        setExistingResults,
        setIsValidated,
    ])

    useEffect(() => {
        loadExistingResults()
    }, [loadExistingResults])

    const currentCriterion = grades[currentCriterionIndex]
    const totalCriteria = grades.length
    const completedCriteria = grades.filter((grade) => grade.isValidated).length

    const getProgressColor = (progress: number): string => {
        if (progress <= 25) return 'bg-red-500'
        if (progress <= 50) return 'bg-yellow-500'
        if (progress <= 75) return 'bg-lime-400'
        return 'bg-green-500'
    }

    const getScoreColor = (progress: number): string => {
        if (progress <= 25) return 'text-red-600'
        if (progress <= 50) return 'text-yellow-600'
        if (progress <= 75) return 'text-lime-500'
        return 'text-green-600'
    }

    const handleSwipeValidation = (direction: 'left' | 'right') => {
        if (!currentCriterion) return
        setSwipeDirection(direction)
        if (direction === 'right') {
            updateGrade(
                currentCriterion.criterionId,
                'score',
                currentCriterion.maxPoints
            )
            updateGrade(currentCriterion.criterionId, 'isValidated', true)
            toast.success(
                `✓ ${currentCriterion.label} validated with full points!`
            )
        } else {
            updateGrade(currentCriterion.criterionId, 'score', 0)
            updateGrade(currentCriterion.criterionId, 'isValidated', true)
            toast.error(`✗ ${currentCriterion.label} marked as not validated`)
        }
        setTimeout(() => {
            if (currentCriterionIndex < totalCriteria - 1) {
                setCurrentCriterionIndex(currentCriterionIndex + 1)
            } else {
                toast.success(
                    '🎉 All criteria completed! You can now save your grading.'
                )
            }
            setSwipeDirection(null)
        }, 500)
    }

    const handleDragEnd = (_event: unknown, info: PanInfo) => {
        const threshold = 100
        if (info.offset.x > threshold) {
            handleSwipeValidation('right')
        } else if (info.offset.x < -threshold) {
            handleSwipeValidation('left')
        }
    }

    const updateGrade = useCallback(
        (
            criterionId: string,
            field: 'score' | 'comment' | 'isValidated',
            value: number | string | boolean
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
                const weight = criterion.weight ?? 1
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
            return hasScore && hasRequiredComment && grade.isValidated
        })
    }, [grades, gradingScale.criteria])

    const handleSaveGrades = useCallback(async () => {
        if (!isGradingComplete) {
            toast.error('Please complete all criteria before saving')
            return
        }
        setIsLoading(true)
        try {
            const results = grades.map((grade) => ({
                gradingCriterionId: grade.criterionId,
                targetStudentId,
                targetGroupId,
                score: Math.max(0, Math.min(grade.maxPoints, grade.score)),
                comment: grade.comment,
            }))
            const response = await gradingService.validateGridWorkflow(
                gradingScale.id,
                results
            )
            if (response.success) {
                toast.success(
                    '🎉 Grading completed and validated successfully! All criteria have been evaluated.'
                )
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

    const navigateToCriterion = (index: number) => {
        if (index >= 0 && index < totalCriteria) {
            setCurrentCriterionIndex(index)
        }
    }

    if (isValidated || readOnly) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        {isValidated
                            ? 'Grading Complete'
                            : 'Grading View'} - {gradingScale.title}
                    </CardTitle>
                    <CardDescription>
                        {isValidated
                            ? 'This grading has been validated and is now read-only.'
                            : 'Viewing grading in read-only mode.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <Label>Total Score</Label>
                                <p
                                    className={`text-2xl font-bold ${getScoreColor(calculateTotalScore)}`}
                                >
                                    {calculateTotalScore}%
                                </p>
                            </div>
                            <div>
                                <Label>Criteria Completed</Label>
                                <p>
                                    {grades.filter((g) => g.isValidated).length}
                                    /{totalCriteria}
                                </p>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Badge
                                    variant={
                                        isValidated ? 'secondary' : 'outline'
                                    }
                                >
                                    {isValidated ? 'Validated' : 'In Progress'}
                                </Badge>
                            </div>
                        </div>
                        {grades.map((grade, index) => (
                            <div
                                key={grade.criterionId}
                                className="border rounded-lg p-4"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium">
                                        {index + 1}. {grade.label}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`font-bold ${
                                                grade.isValidated
                                                    ? getScoreColor(
                                                          (grade.score /
                                                              grade.maxPoints) *
                                                              100
                                                      )
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {grade.isValidated
                                                ? `${grade.score}/${grade.maxPoints}`
                                                : `--/${grade.maxPoints}`}
                                        </span>
                                        {grade.isValidated && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        )}
                                    </div>
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
        <div className="w-full max-w-full overflow-hidden">
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl truncate">
                        {gradingScale.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Swipe right to validate (✓) or left to invalidate (✗)
                        each criterion
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                            Criterion {currentCriterionIndex + 1} of{' '}
                            {totalCriteria}
                        </span>
                        <span
                            className={`text-sm font-medium ${getScoreColor(calculateTotalScore)}`}
                        >
                            Total Score: {calculateTotalScore}%
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(calculateTotalScore)}`}
                            style={{
                                width: `${(completedCriteria / totalCriteria) * 100}%`,
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="overflow-hidden px-4 sm:px-6">
                    {currentCriterion && (
                        <div className="space-y-4 sm:space-y-6">
                            <div
                                ref={constraintsRef}
                                className="relative h-64 sm:h-80 w-full overflow-hidden"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentCriterion.criterionId}
                                        className="absolute inset-0 w-full max-w-full"
                                        {...(!readOnly && {
                                            drag: 'x',
                                            dragConstraints: {
                                                left: -50,
                                                right: 50,
                                            },
                                            dragElastic: 0.1,
                                            onDragEnd: handleDragEnd,
                                            whileDrag: {
                                                scale: 1.01,
                                                rotate: 0,
                                            },
                                        })}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            x:
                                                swipeDirection === 'right'
                                                    ? 100
                                                    : swipeDirection === 'left'
                                                      ? -100
                                                      : 0,
                                            rotate:
                                                swipeDirection === 'right'
                                                    ? 3
                                                    : swipeDirection === 'left'
                                                      ? -3
                                                      : 0,
                                        }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            maxWidth: '100%',
                                            width: '100%',
                                        }}
                                    >
                                        <Card
                                            className={`h-full w-full transition-colors ${
                                                !readOnly
                                                    ? 'cursor-grab active:cursor-grabbing'
                                                    : ''
                                            } ${
                                                swipeDirection === 'right'
                                                    ? 'bg-green-50 border-green-200'
                                                    : swipeDirection === 'left'
                                                      ? 'bg-red-50 border-red-200'
                                                      : ''
                                            }`}
                                        >
                                            <CardContent className="p-4 sm:p-6 h-full flex flex-col justify-center">
                                                <div className="text-center space-y-3 sm:space-y-4">
                                                    <h3 className="text-lg sm:text-xl font-semibold break-words">
                                                        {currentCriterion.label}
                                                    </h3>
                                                    <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                                                        {
                                                            currentCriterion.maxPoints
                                                        }{' '}
                                                        points max
                                                    </div>
                                                    <div
                                                        className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                                                            (currentCriterion.score /
                                                                currentCriterion.maxPoints) *
                                                                100
                                                        )}`}
                                                    >
                                                        Current Score:{' '}
                                                        {currentCriterion.score}
                                                        /
                                                        {
                                                            currentCriterion.maxPoints
                                                        }
                                                    </div>
                                                    {!readOnly && (
                                                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4 sm:gap-2">
                                                            <div className="flex items-center gap-2 text-red-600">
                                                                <X className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                                                <span className="text-xs sm:text-sm text-center">
                                                                    Swipe left
                                                                    to
                                                                    invalidate
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-green-600">
                                                                <span className="text-xs sm:text-sm text-center">
                                                                    Swipe right
                                                                    to validate
                                                                </span>
                                                                <Check className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Manual Score (0 -{' '}
                                        {currentCriterion.maxPoints})
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={currentCriterion.maxPoints}
                                        step={0.5}
                                        value={
                                            currentCriterion.score === 0
                                                ? ''
                                                : currentCriterion.score
                                        }
                                        placeholder="Enter score..."
                                        onChange={(e) => {
                                            if (readOnly) return
                                            const value =
                                                e.target.value === ''
                                                    ? 0
                                                    : parseFloat(e.target.value)
                                            if (
                                                !isNaN(value) &&
                                                value >= 0 &&
                                                value <=
                                                    currentCriterion.maxPoints
                                            ) {
                                                updateGrade(
                                                    currentCriterion.criterionId,
                                                    'score',
                                                    value
                                                )
                                                updateGrade(
                                                    currentCriterion.criterionId,
                                                    'isValidated',
                                                    true
                                                )
                                            }
                                        }}
                                        className="w-full sm:w-32"
                                        disabled={readOnly}
                                        readOnly={readOnly}
                                    />
                                </div>
                                {currentCriterion.commentEnabled && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">
                                            Comment
                                        </Label>
                                        <Textarea
                                            value={currentCriterion.comment}
                                            onChange={(e) => {
                                                if (readOnly) return
                                                updateGrade(
                                                    currentCriterion.criterionId,
                                                    'comment',
                                                    e.target.value
                                                )
                                            }}
                                            placeholder="Add a comment..."
                                            rows={3}
                                            className="w-full resize-none"
                                            disabled={readOnly}
                                            readOnly={readOnly}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        navigateToCriterion(
                                            currentCriterionIndex - 1
                                        )
                                    }
                                    disabled={currentCriterionIndex === 0}
                                    className="w-full sm:w-auto order-1 sm:order-none"
                                    size="sm"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>
                                <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-none">
                                    {!readOnly && (
                                        <>
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    handleSwipeValidation(
                                                        'left'
                                                    )
                                                }
                                                className="flex items-center gap-2 flex-1 sm:flex-none"
                                                size="sm"
                                            >
                                                <X className="w-4 h-4" />
                                                <span className="hidden sm:inline">
                                                    Invalidate (0 pts)
                                                </span>
                                                <span className="sm:hidden">
                                                    Invalid
                                                </span>
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() =>
                                                    handleSwipeValidation(
                                                        'right'
                                                    )
                                                }
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                                size="sm"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span className="hidden sm:inline">
                                                    Validate (Full pts)
                                                </span>
                                                <span className="sm:hidden">
                                                    Valid
                                                </span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        navigateToCriterion(
                                            currentCriterionIndex + 1
                                        )
                                    }
                                    disabled={
                                        currentCriterionIndex ===
                                        totalCriteria - 1
                                    }
                                    className="w-full sm:w-auto order-3 sm:order-none"
                                    size="sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                {grades.map((grade, index) => (
                                    <div
                                        key={grade.criterionId}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                            index === currentCriterionIndex
                                                ? 'bg-primary/10 border border-primary'
                                                : 'bg-muted hover:bg-muted/80'
                                        }`}
                                        onClick={() =>
                                            navigateToCriterion(index)
                                        }
                                    >
                                        <span className="text-sm font-medium truncate flex-1 mr-2">
                                            {index + 1}. {grade.label}
                                        </span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span
                                                className={`text-sm font-medium ${
                                                    grade.isValidated
                                                        ? getScoreColor(
                                                              (grade.score /
                                                                  grade.maxPoints) *
                                                                  100
                                                          )
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {grade.score}/{grade.maxPoints}
                                            </span>
                                            {grade.isValidated && (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                {!readOnly && (
                                    <Button
                                        onClick={handleSaveGrades}
                                        disabled={
                                            isLoading || !isGradingComplete
                                        }
                                        className="flex items-center gap-2 flex-1"
                                        size="sm"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isLoading
                                            ? 'Saving...'
                                            : 'Save & Complete Grading'}
                                    </Button>
                                )}
                                {onCancel && (
                                    <Button
                                        onClick={onCancel}
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        size="sm"
                                    >
                                        {readOnly ? 'Close' : 'Cancel'}
                                    </Button>
                                )}
                            </div>
                            {!readOnly && !isGradingComplete && (
                                <div className="text-sm text-muted-foreground text-center">
                                    Complete all criteria to enable saving
                                </div>
                            )}
                            {readOnly && (
                                <div className="text-sm text-muted-foreground text-center">
                                    Viewing completed grading results
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default SwipeGradingInterface
