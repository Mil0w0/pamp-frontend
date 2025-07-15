import React, { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { gradingService } from '@/services/GradingService/grading-api-client'
import { GradingScale, GradingResult } from '@/components/GradingSystem/type'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CheckCircle2 } from 'lucide-react'

interface GradingConsultationProps {
    stepId: string
    studentId: string
}

export function GradingConsultation({
    stepId,
    studentId,
}: GradingConsultationProps) {
    const [gradingScale, setGradingScale] = useState<GradingScale | null>(null)
    const [gradingResults, setGradingResults] = useState<GradingResult[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchGradingData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch grading scale for this step
                const scale =
                    await gradingService.getGradingScaleByTarget(stepId)

                if (!scale) {
                    setError('No grading scale found for this step')
                    return
                }

                // Only show if the scale is validated
                if (!scale.isValidated) {
                    setError('Grading scale is not yet validated')
                    return
                }

                setGradingScale(scale)

                // Fetch grading results for this student
                const results = await gradingService.getGradingResults(
                    scale.id,
                    studentId
                )
                setGradingResults(results)
            } catch (err) {
                console.error('Error fetching grading data:', err)
                setError('Failed to load grading information')
            } finally {
                setLoading(false)
            }
        }

        fetchGradingData()
    }, [stepId, studentId])

    if (loading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!gradingScale) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                        No grading information available
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Calculate total score and weighted score
    const totalMaxScore = gradingScale.criteria.reduce(
        (sum, criterion) => sum + criterion.maxScore,
        0
    )
    const totalWeightedMaxScore = gradingScale.criteria.reduce(
        (sum, criterion) => sum + criterion.maxScore * criterion.weight,
        0
    )

    const studentResults = gradingResults.filter(
        (result) => result.targetId === studentId
    )
    const totalScore = studentResults.reduce(
        (sum, result) => sum + result.score,
        0
    )
    const totalWeightedScore = studentResults.reduce((sum, result) => {
        const criterion = gradingScale.criteria.find(
            (c) => c.id === result.criterionId
        )
        return sum + result.score * (criterion?.weight || 1)
    }, 0)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {gradingScale.title}
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Validated
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Grading Mode:{' '}
                                {gradingScale.notationMode === 'GROUP'
                                    ? 'Group'
                                    : 'Individual'}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {totalWeightedScore.toFixed(1)} /{' '}
                                {totalWeightedMaxScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Weighted Score
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Raw Score:</span>{' '}
                                {totalScore} / {totalMaxScore}
                            </div>
                            <div>
                                <span className="font-medium">Percentage:</span>{' '}
                                {(
                                    (totalWeightedScore /
                                        totalWeightedMaxScore) *
                                    100
                                ).toFixed(1)}
                                %
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="font-medium">Detailed Results</h4>
                            {gradingScale.criteria.map((criterion) => {
                                const result = studentResults.find(
                                    (r) => r.criterionId === criterion.id
                                )
                                const weightedScore = result
                                    ? result.score * criterion.weight
                                    : 0
                                const maxWeightedScore =
                                    criterion.maxScore * criterion.weight

                                return (
                                    <div
                                        key={criterion.id}
                                        className="border rounded-lg p-4 space-y-2"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h5 className="font-medium">
                                                    {criterion.label}
                                                </h5>
                                                <div className="text-sm text-muted-foreground">
                                                    Weight: {criterion.weight}x
                                                    | Max Score:{' '}
                                                    {criterion.maxScore}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">
                                                    {result?.score || 0} /{' '}
                                                    {criterion.maxScore}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Weighted:{' '}
                                                    {weightedScore.toFixed(1)} /{' '}
                                                    {maxWeightedScore.toFixed(
                                                        1
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {result?.comment && (
                                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                <strong>Comment:</strong>{' '}
                                                {result.comment}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {gradingResults.some((r) => r.globalComment) && (
                            <div className="mt-4">
                                <Separator className="mb-4" />
                                <h4 className="font-medium mb-2">
                                    Global Comment
                                </h4>
                                <div className="p-3 bg-muted rounded">
                                    {
                                        gradingResults.find(
                                            (r) => r.globalComment
                                        )?.globalComment
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
