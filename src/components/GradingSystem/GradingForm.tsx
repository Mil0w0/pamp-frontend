import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
    memo,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Save, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import {
    GradingResult,
    GradingCriterion,
    GradingApiResponse,
} from '@/components/GradingSystem/type'
import { gradingService } from '@/services/GradingService/grading-api-client'
import {
    formatScore,
    formatPercentage,
    calculateFinalGrade,
} from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'
import { useSwipeable } from 'react-swipeable'
import { toast } from 'sonner'

// Composant optimisé pour un critère individuel

interface GradingFormProps {
    gridId: string
    targetGroupId?: string
    targetStudentId?: string
    onSave?: (results: GradingResult[], generalComment?: string) => void
    readOnly?: boolean
}

export const GradingForm: React.FC<GradingFormProps> = memo(
    ({ gridId, targetGroupId, targetStudentId, onSave, readOnly = false }) => {
        const {
            grid,
            loading,
            saving,
            error,
            saveResults,
            clearError,
            isResultsComplete,
            canValidate,
            missingCriteria,
            loadGrid,
        } = useGradingGrid({ gridId })

        const [results, setResults] = useState<Record<string, GradingResult>>(
            {}
        )
        const [generalComment, setGeneralComment] = useState('')
        const [showValidation, setShowValidation] = useState(false)
        const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
        const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

        // Memoized results initialization
        const initialResults = useMemo(() => {
            if (!grid?.results) return {}

            const resultMap: Record<string, GradingResult> = {}
            grid.results.forEach((result) => {
                if (
                    (targetGroupId && result.targetGroupId === targetGroupId) ||
                    (targetStudentId &&
                        result.targetStudentId === targetStudentId)
                ) {
                    resultMap[result.gradingCriterionId] = result
                }
            })
            return resultMap
        }, [grid?.results, targetGroupId, targetStudentId])

        // Initialize results with existing data, defaulting to 0 for missing criteria when not readOnly
        useEffect(() => {
            const newResults = { ...initialResults }
            if (!readOnly && grid?.criteria) {
                grid.criteria.forEach((criterion) => {
                    if (!newResults[criterion.id]) {
                        newResults[criterion.id] = {
                            gradingCriterionId: criterion.id,
                            targetGroupId,
                            targetStudentId,
                            score: 0,
                            comment: '',
                        }
                    }
                })
            }
            setResults(newResults)
        }, [initialResults, readOnly, grid, targetGroupId, targetStudentId])

        // Separate effect for general comment to avoid unnecessary re-renders
        useEffect(() => {
            setGeneralComment(grid?.generalComment || '')
        }, [grid?.generalComment])
        // Monitor grid validation status changes with cleanup
        useEffect(() => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current)
                validationTimeoutRef.current = null
            }

            if (grid?.isValidated) {
                setShowValidation(true)
                validationTimeoutRef.current = setTimeout(() => {
                    setShowValidation(false)
                }, 5000)
            } else {
                setShowValidation(false)
            }

            return () => {
                if (validationTimeoutRef.current) {
                    clearTimeout(validationTimeoutRef.current)
                }
            }
        }, [grid?.isValidated])

        const handleScoreChange = useCallback(
            (criterion: GradingCriterion, score: number) => {
                if (score < 0 || score > criterion.maxPoints || isNaN(score)) return;
                setResults((prev) => {
                    const existingResult = prev[criterion.id];
                    if (existingResult?.score === score) return prev;
                    const result: GradingResult = {
                        gradingCriterionId: criterion.id,
                        targetGroupId,
                        targetStudentId,
                        score,
                        comment: existingResult?.comment || '',
                    };
                    return { ...prev, [criterion.id]: result };
                });
            },
            [targetGroupId, targetStudentId]
        )

        const handleCommentChange = useCallback(
            (criterionId: string, comment: string) => {
                setResults((prev) => {
                    const existingResult = prev[criterionId]
                    if (!existingResult) return prev

                    return {
                        ...prev,
                        [criterionId]: {
                            ...existingResult,
                            comment,
                        },
                    }
                })
            },
            []
        )

        const handleSave = useCallback(async () => {
            if (!grid) return

            const resultsList = Object.values(results).filter(
                (result) => result.score !== undefined && result.score >= 0
            )

            if (resultsList.length === 0) {
                alert(
                    'No results to save. Please grade at least one criterion.'
                )
                return
            }

            try {
                const formattedResults = resultsList.map((result) => ({
                    gradingCriterionId: result.gradingCriterionId,
                    score: result.score,
                    comment: result.comment || '',
                    targetGroupId: targetGroupId || undefined,
                    targetStudentId: targetStudentId || undefined,
                }))

                const saveResponse: GradingApiResponse | undefined =
                    await gradingService.saveResults(
                        grid.id,
                        formattedResults,
                        generalComment
                    )

                if (saveResponse?.success) {
                    await loadGrid(grid.id)
                    onSave?.(resultsList, generalComment)
                }
            } catch (err) {
                console.error('Error during save:', err)
                alert(
                    'Error during save: ' +
                        (err instanceof Error ? err.message : String(err))
                )
            }
        }, [
            grid,
            results,
            generalComment,
            targetGroupId,
            targetStudentId,
            saveResults,
            loadGrid,
            onSave,
        ])

        const handleValidate = useCallback(async () => {
            console.log('handleValidate started', {
                gridId: grid?.id,
                targetGroupId,
                resultsCount: Object.keys(results).length,
            })
            if (!grid || !targetGroupId) {
                console.log('Missing required data for validation')
                alert('Missing required data for validation')
                return
            }

            if (grid.isValidated) {
                console.log('Grid already validated')
                alert('The grading scale is already validated.')
                return
            }

            // Check that all criteria have a score (0 is a valid score)
            // Dans handleValidate, remplacer la vérification missingCriteria par:
            const missingCriteria = grid.criteria.filter((criterion) => {
                const result = results[criterion.id]
                const isMissing =
                    !result ||
                    result.score === undefined ||
                    result.score === null
                console.log(
                    `Checking criterion ${criterion.id} (${criterion.label}):`,
                    { result, isMissing }
                )
                return isMissing
            })

            if (missingCriteria.length > 0) {
                const missingLabels = missingCriteria
                    .map((c) => c.label)
                    .join(', ')
                console.log('Missing criteria', { missingLabels })
                alert(
                    `Please grade all criteria before validating. Missing: ${missingLabels}`
                )
                return
            }

            try {
                const resultsList = Object.values(results).filter(
                    (result) => result.score !== undefined && result.score >= 0
                )

                const formattedResults = resultsList.map((result) => ({
                    gradingCriterionId: result.gradingCriterionId,
                    score: result.score,
                    comment: result.comment || '',
                    targetGroupId: targetGroupId || undefined,
                    targetStudentId: targetStudentId || undefined,
                }))

                console.log('Saving results', {
                    formattedResults,
                    generalComment,
                })
                // Save results first
                const saveResponse: GradingApiResponse | undefined =
                    await gradingService.saveResults(
                        grid.id,
                        formattedResults,
                        generalComment
                    )
                console.log('Save response', saveResponse)

                if (saveResponse == null || !saveResponse.success) {
                    console.log('Error saving results', {
                        error: saveResponse?.error,
                    })
                    alert(
                        'Error saving results: ' +
                            (saveResponse?.error || 'Unknown error')
                    )
                    return
                }

                console.log('Validating grid', { gridId: grid.id })
                // Validate
                const validateResponse: GradingApiResponse | undefined =
                    await gradingService.validateGrid(grid.id)
                console.log('Validate response', validateResponse)

                if (validateResponse != null && validateResponse.success) {
                    console.log('Validation successful, loading grid')
                    await loadGrid(grid.id)
                    toast.success('Grading validated successfully')
                } else {
                    console.log('Validation failed', { validateResponse })
                }
            } catch (err) {
                console.error('Error during validation:', err)
                console.log('Validation error details', { error: err })
                alert(
                    'Error during validation: ' +
                        (err instanceof Error ? err.message : String(err))
                )
            }
            console.log('handleValidate ended')
        }, [grid, targetGroupId, results, generalComment, loadGrid])

        // Memoized calculations for performance
        const currentStats = useMemo(() => {
            if (!grid) return null

            const currentResults = Object.values(results).filter(
                (r) => r.score !== undefined
            )
            return {
                totalScore: currentResults.reduce((sum, r) => sum + r.score, 0),
                maxScore: Array.isArray(grid.criteria)
                    ? grid.criteria.reduce((sum, c) => {
                          const hasResult = results[c.id]?.score !== undefined
                          return sum + (hasResult ? c.maxPoints : 0)
                      }, 0)
                    : 0,
                completedCriteria: currentResults.length,
                totalCriteria: Array.isArray(grid.criteria)
                    ? grid.criteria.length
                    : 0,
            }
        }, [grid, results])

        const finalGrade = useMemo(() => {
            return grid && Object.keys(results).length > 0
                ? calculateFinalGrade(grid.criteria, Object.values(results))
                : 0
        }, [grid, results])

        if (loading) {
            return (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Loading...</span>
                        </div>
                    </CardContent>
                </Card>
            )
        }

        if (!grid) {
            return (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Grading grid not found.</AlertDescription>
                </Alert>
            )
        }

        return (
            <div className="space-y-6">
                {error && (
                    <ErrorDisplay
                        error={error}
                        onRetry={() => window.location.reload()}
                        onDismiss={clearError}
                    />
                )}

                {showValidation && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            The grid has been successfully validated!
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{grid.title}</span>
                            <div className="flex items-center gap-2">
                                {grid.isValidated && (
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                        title={
                                            grid.validatedAt
                                                ? `Validated on ${new Date(grid.validatedAt).toLocaleString()}`
                                                : 'Validated'
                                        }
                                    >
                                        <CheckCircle className="h-3 w-3" />
                                        Validated
                                        {grid.validatedAt && (
                                            <span className="ml-1 text-xs opacity-75">
                                                (
                                                {new Date(
                                                    grid.validatedAt
                                                ).toLocaleDateString()}
                                                )
                                            </span>
                                        )}
                                    </Badge>
                                )}
                                {readOnly && (
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-1"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Read Only
                                    </Badge>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Progress */}
                        {currentStats && (
                            <div className="mb-6 p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        Progress
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {currentStats.completedCriteria}/
                                        {currentStats.totalCriteria} criteria
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        (currentStats.completedCriteria /
                                            currentStats.totalCriteria) *
                                        100
                                    }
                                    className="mb-3"
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Current Score:
                                        </span>
                                        <div className="font-medium">
                                            {formatScore(
                                                currentStats.totalScore,
                                                currentStats.maxScore
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Percentage:
                                        </span>
                                        <div className="font-medium">
                                            {currentStats.maxScore > 0
                                                ? formatPercentage(
                                                      (currentStats.totalScore /
                                                          currentStats.maxScore) *
                                                          100
                                                  )
                                                : '0%'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Grade out of 20:
                                        </span>
                                        <div className="font-medium">
                                            {finalGrade.toFixed(1)}/20
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Status:
                                        </span>
                                        <div className="font-medium">
                                            {isResultsComplete ? (
                                                <span className="text-green-600">
                                                    Complete
                                                </span>
                                            ) : (
                                                <span className="text-orange-600">
                                                    In Progress
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Single grading criterion with navigation */}
                        <div className="flex items-center justify-center mb-4">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    setCurrentCriterionIndex((i) =>
                                        Math.max(i - 1, 0)
                                    )
                                }
                                disabled={currentCriterionIndex === 0}
                            >
                                ◀
                            </Button>
                            <span className="mx-2 text-sm">
                                Criterion {currentCriterionIndex + 1} /{' '}
                                {grid.criteria.length}
                            </span>
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    setCurrentCriterionIndex((i) =>
                                        Math.min(
                                            i + 1,
                                            grid.criteria.length - 1
                                        )
                                    )
                                }
                                disabled={
                                    currentCriterionIndex ===
                                    grid.criteria.length - 1
                                }
                            >
                                ▶
                            </Button>
                        </div>
                        <div className="relative h-[260px] overflow-hidden">
                            <div
                                className="absolute w-full transition-transform duration-500"
                                style={{
                                    transform: `translateX(-${currentCriterionIndex * 100}%)`,
                                    display: 'flex',
                                    height: '100%',
                                }}
                            >
                                {grid.criteria.map((criterion, index) => {
                                    const result = results[criterion.id]
                                    const score = result?.score ?? ''
                                    const comment = result?.comment ?? ''
                                    return (
                                        <div
                                            key={criterion.id}
                                            style={{
                                                minWidth: '100%',
                                                height: '100%',
                                            }}
                                        >
                                            <GradingCriterionSwipe
                                                criterion={criterion}
                                                index={index}
                                                score={score}
                                                comment={comment}
                                                handleScoreChange={
                                                    handleScoreChange
                                                }
                                                handleCommentChange={
                                                    handleCommentChange
                                                }
                                                readOnly={readOnly}
                                                isValidated={grid.isValidated}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* General Comment */}
                        <div className="mt-6 space-y-2">
                            <Label htmlFor="generalComment">
                                General Comment
                            </Label>
                            <Textarea
                                id="generalComment"
                                value={generalComment}
                                onChange={(e) =>
                                    setGeneralComment(e.target.value)
                                }
                                placeholder="General comment on the evaluation..."
                                disabled={readOnly || grid.isValidated}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Validation */}
                {!isResultsComplete && missingCriteria.length > 0 && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Ungraded criteria:</strong>{' '}
                            {missingCriteria.join(', ')}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                {!readOnly && !grid.isValidated && (
                    <div className="flex items-center justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={handleSave}
                            disabled={
                                saving || Object.keys(results).length === 0
                            }
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                        </Button>

                        {canValidate && (
                            <Button
                                onClick={handleValidate}
                                disabled={saving || !isResultsComplete}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Validate Grading
                            </Button>
                        )}
                    </div>
                )}
            </div>
        )
    }
)

// Memoized child component for a single criterion with swipe
const GradingCriterionSwipe = React.memo<{
    criterion: GradingCriterion
    index: number
    score: number | ''
    comment: string
    handleScoreChange: (criterion: GradingCriterion, score: number) => void
    handleCommentChange: (criterionId: string, comment: string) => void
    readOnly: boolean
    isValidated: boolean
}>(
    ({
        criterion,
        index,
        score,
        comment,
        handleScoreChange,
        handleCommentChange,
        readOnly,
        isValidated,
    }) => {
        const [swipeAnim, setSwipeAnim] = useState('')
        const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

        const clearAnimationTimeout = useCallback(() => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
                animationTimeoutRef.current = null
            }
        }, [])

        const setAnimationWithTimeout = useCallback(
            (animation: string) => {
                clearAnimationTimeout()
                setSwipeAnim(animation)
                animationTimeoutRef.current = setTimeout(() => {
                    setSwipeAnim('')
                }, 400)
            },
            [clearAnimationTimeout]
        )

        const swipeHandlers = useSwipeable({
            onSwipedLeft: useCallback(() => {
                if (!readOnly && !isValidated) {
                    setAnimationWithTimeout('animate-swipe-left')
                    handleScoreChange(criterion, 0)
                }
            }, [
                readOnly,
                isValidated,
                setAnimationWithTimeout,
                handleScoreChange,
                criterion,
            ]),
            onSwipedRight: useCallback(() => {
                if (!readOnly && !isValidated) {
                    setAnimationWithTimeout('animate-swipe-right')
                    handleScoreChange(criterion, criterion.maxPoints)
                }
            }, [
                readOnly,
                isValidated,
                setAnimationWithTimeout,
                handleScoreChange,
                criterion,
            ]),
            trackMouse: true,
        })

        useEffect(() => {
            return () => clearAnimationTimeout()
        }, [clearAnimationTimeout])
        return (
            <div
                key={criterion.id}
                {...swipeHandlers}
                className={swipeAnim}
                style={{ cursor: 'pointer' }}
            >
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {index + 1}. {criterion.label}
                            </CardTitle>
                            <Badge variant="outline">
                                Weight: {criterion.weight}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`score-${criterion.id}`}>
                                    Score (out of {criterion.maxPoints})
                                </Label>
                                <Input
                                    id={`score-${criterion.id}`}
                                    type="number"
                                    min="0"
                                    max={criterion.maxPoints}
                                    step="0.5"
                                    value={score}
                                    onChange={useCallback(
                                        (e: { target: { value: string } }) => {
                                            const value = parseFloat(
                                                e.target.value
                                            )
                                            if (!isNaN(value)) {
                                                handleScoreChange(
                                                    criterion,
                                                    value
                                                )
                                            }
                                        },
                                        [handleScoreChange, criterion]
                                    )}
                                    placeholder={`0 - ${criterion.maxPoints}`}
                                    disabled={readOnly || isValidated}
                                    className={
                                        score !== undefined && score !== 0
                                            ? 'border-green-500'
                                            : ''
                                    }
                                />
                            </div>
                            {criterion.commentEnabled && (
                                <div className="space-y-2">
                                    <Label htmlFor={`comment-${criterion.id}`}>
                                        Comment
                                    </Label>
                                    <Textarea
                                        id={`comment-${criterion.id}`}
                                        value={comment}
                                        onChange={useCallback(
                                            (e: {
                                                target: { value: string }
                                            }) =>
                                                handleCommentChange(
                                                    criterion.id,
                                                    e.target.value
                                                ),
                                            [handleCommentChange, criterion.id]
                                        )}
                                        placeholder="Optional comment..."
                                        disabled={readOnly || isValidated}
                                        rows={2}
                                    />
                                </div>
                            )}
                        </div>
                        {score !== undefined && score !== 0 && (
                            <div className="text-sm text-muted-foreground">
                                Percentage:{' '}
                                {formatPercentage(
                                    (Number(score) / criterion.maxPoints) * 100
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }
)

// Add swipe animations to global CSS (e.g., in index.css or a global file)
/*
.animate-swipe-left {
  animation: swipeLeft 0.4s cubic-bezier(0.4,0,0.2,1);
}
.animate-swipe-right {
  animation: swipeRight 0.4s cubic-bezier(0.4,0,0.2,1);
}
@keyframes swipeLeft {
  0% { transform: translateX(0); }
  80% { transform: translateX(-40px) scale(0.98); }
  100% { transform: translateX(0); }
}
@keyframes swipeRight {
  0% { transform: translateX(0); }
  80% { transform: translateX(40px) scale(0.98); }
  100% { transform: translateX(0); }
}
*/
