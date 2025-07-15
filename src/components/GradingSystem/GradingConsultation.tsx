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
import { GradingGrid, GradingResult } from '@/components/GradingSystem/type'
//import { calculateGradingStats } from '@/utils/gradingCalculations'
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
    const [gradingGrid, setGradingGrid] = useState<GradingGrid | null>(null)
    const [gradingResults, setGradingResults] = useState<GradingResult[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchGradingData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch grading grid for this step
                const response = await gradingService.getGridByTarget(
                    stepId, // assuming stepId is projectId
                    'livrable', // or determine type based on context
                    stepId
                )

                if (!response.success || !response.data) {
                    setError('No grading grid found for this step')
                    return
                }

                const grid = response.data as GradingGrid

                // Only show if the grid is validated
                if (!grid.isValidated) {
                    setError('Grading grid is not yet validated')
                    return
                }

                setGradingGrid(grid)
                // Results are already included in the grid
                setGradingResults(grid.results || [])
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

    if (!gradingGrid) {
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

    // Calculate total score and weighted score using proper typing
    const totalMaxScore = gradingGrid.criteria.reduce(
        (sum: number, criterion) => sum + criterion.maxPoints,
        0
    )
    const totalWeightedMaxScore = gradingGrid.criteria.reduce(
        (sum: number, criterion) =>
            sum + criterion.maxPoints * criterion.weight,
        0
    )

    const studentResults = gradingResults.filter(
        (result) => result.targetStudentId === studentId
    )
    const totalScore = studentResults.reduce(
        (sum: number, result) => sum + result.score,
        0
    )
    const totalWeightedScore = studentResults.reduce((sum: number, result) => {
        const criterion = gradingGrid.criteria.find(
            (c) => c.id === result.gradingCriterionId
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
                                {gradingGrid.title}
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
                                {gradingGrid.notationMode === 'groupe'
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
                            {gradingGrid.criteria.map((criterion) => {
                                const result = studentResults.find(
                                    (r) => r.gradingCriterionId === criterion.id
                                )
                                const weightedScore = result
                                    ? result.score * criterion.weight
                                    : 0
                                const maxWeightedScore =
                                    criterion.maxPoints * criterion.weight

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
                                                    {criterion.maxPoints}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">
                                                    {result?.score || 0} /{' '}
                                                    {criterion.maxPoints}
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

                        {gradingResults.some((r) => r.comment) && (
                            <div className="mt-4">
                                <Separator className="mb-4" />
                                <h4 className="font-medium mb-2">
                                    Global Comment
                                </h4>
                                <div className="p-3 bg-muted rounded">
                                    {gradingResults.find((r) => r.comment)
                                        ?.comment || ''}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
