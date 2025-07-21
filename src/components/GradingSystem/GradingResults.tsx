import React, { useState, useMemo, useCallback } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    CheckCircle,
    Clock,
    FileText,
    Users,
    User,
    Eye,
    TrendingUp,
} from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import { GradingGrid, GradingGridType, NotationMode } from '@/types/grading'
import {
    formatPercentage,
    calculateGradingStats,
} from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'

interface GradingResultsProps {
    projectId: string
    onViewGrid?: (grid: GradingGrid) => void
}

type FilterType = 'all' | GradingGridType
type FilterStatus = 'all' | 'validated' | 'draft'
type SortBy = 'title' | 'type' | 'average' | 'date'

interface GridWithStats extends GradingGrid {
    averageScore: number
    completionRate: number
    totalResults: number
}

export const GradingResults: React.FC<GradingResultsProps> = ({
    projectId,
    onViewGrid,
}) => {
    const { grids, loading, error, loadProjectGrids } = useGradingGrid({
        projectId,
    })

    const [filterType] = useState<FilterType>('all')
    const [filterStatus] = useState<FilterStatus>('validated')
    const [sortBy] = useState<SortBy>('date')

    const getProgressColor = (progress: number): string => {
        if (progress <= 25) return 'text-red-600'
        if (progress <= 50) return 'text-yellow-500'
        if (progress <= 75) return 'text-yellow-400'
        return 'text-green-500'
    }

    const getProgressBgColor = (progress: number): string => {
        if (progress <= 25) return 'bg-red-100'
        if (progress <= 50) return 'bg-yellow-100'
        if (progress <= 75) return 'bg-yellow-100'
        return 'bg-green-100'
    }

    const gridsWithStats: GridWithStats[] = useMemo(() => {
        return grids.map((grid) => {
            const stats = calculateGradingStats(grid.criteria, grid.results)
            const resultsMap = new Map<string, unknown>()
            if (Array.isArray(grid.results)) {
                grid.results.forEach((result) => {
                    resultsMap.set(result.gradingCriterionId, result)
                })
            }
            const completedCriteria = (grid.criteria || []).filter(
                (criterion) => {
                    const result = resultsMap.get(criterion.id)
                    return (
                        result &&
                        typeof result === 'object' &&
                        result !== null &&
                        'score' in result &&
                        result.score !== undefined &&
                        'score' in result &&
                        result.score !== null
                    )
                }
            )
            const completionRate =
                grid.criteria.length > 0
                    ? (completedCriteria.length / grid.criteria.length) * 100
                    : 0
            return {
                ...grid,
                averageScore: stats.simpleAverage,
                completionRate: Math.min(completionRate, 100),
                totalResults: completedCriteria.length,
            }
        })
    }, [grids])

    const filteredAndSortedGrids = useMemo(() => {
        return gridsWithStats
            .filter((grid) => {
                const matchesType =
                    filterType === 'all' ||
                    (filterType === 'deliverable' &&
                        (grid.type === 'deliverable' ||
                            grid.type === 'livrable')) ||
                    (filterType === 'report' &&
                        (grid.type === 'report' || grid.type === 'rapport')) ||
                    (filterType === 'presentation' &&
                        (grid.type === 'presentation' ||
                            grid.type === 'soutenance'))
                const matchesStatus =
                    filterStatus === 'all' ||
                    (filterStatus === 'validated' && grid.isValidated) ||
                    (filterStatus === 'draft' && !grid.isValidated)
                return matchesType && matchesStatus
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'title':
                        return a.title.localeCompare(b.title)
                    case 'type':
                        return a.type.localeCompare(b.type)
                    case 'average':
                        return b.averageScore - a.averageScore
                    case 'date':
                        return (
                            new Date(
                                b.updatedAt || b.createdAt || ''
                            ).getTime() -
                            new Date(a.updatedAt || a.createdAt || '').getTime()
                        )
                    default:
                        return 0
                }
            })
    }, [gridsWithStats, filterType, filterStatus, sortBy])

    const globalStats = useMemo(() => {
        return {
            totalGrids: grids.length,
            validatedGrids: grids.filter((g) => g.isValidated).length,
            averageCompletion:
                grids.length > 0
                    ? gridsWithStats.reduce(
                          (sum, g) => sum + g.completionRate,
                          0
                      ) / grids.length
                    : 0,
            overallAverage:
                grids.length > 0
                    ? gridsWithStats.reduce(
                          (sum, g) => sum + g.averageScore,
                          0
                      ) / grids.length
                    : 0,
        }
    }, [grids, gridsWithStats])

    const getTypeIcon = useCallback((type: string) => {
        switch (type) {
            case 'livrable':
            case 'deliverable':
                return <FileText className="h-4 w-4" />
            case 'rapport':
            case 'report':
                return <FileText className="h-4 w-4" />
            case 'soutenance':
            case 'presentation':
                return <Users className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }, [])

    const getTypeLabel = useCallback((type: string) => {
        switch (type) {
            case 'livrable':
            case 'deliverable':
                return 'Deliverable'
            case 'rapport':
            case 'report':
                return 'Report'
            case 'soutenance':
            case 'presentation':
                return 'Presentation'
            default:
                return type
        }
    }, [])

    const getModeIcon = useCallback((mode: NotationMode) => {
        return mode === 'groupe' || mode === 'group' ? (
            <Users className="h-4 w-4" />
        ) : (
            <User className="h-4 w-4" />
        )
    }, [])

    const getScoreColor = useCallback((score: number) => {
        const percentage = (score / 20) * 100
        if (percentage <= 25) return 'text-red-600'
        if (percentage <= 50) return 'text-yellow-500'
        if (percentage <= 75) return 'text-yellow-400'
        return 'text-green-500'
    }, [])

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading results...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <ErrorDisplay
                error={error}
                onRetry={() => loadProjectGrids(projectId)}
                onDismiss={() => window.location.reload()}
            />
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Grading Results</CardTitle>
                        <CardDescription>
                            Overview of all grading grids and their results.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => loadProjectGrids(projectId)}
                        variant="outline"
                        size="sm"
                    >
                        Refresh
                    </Button>
                </CardHeader>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Grids
                                </p>
                                <p className="text-2xl font-bold">
                                    {globalStats.totalGrids}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Validated
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {globalStats.validatedGrids}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Overall Average
                                </p>
                                <p
                                    className={`text-2xl font-bold ${getScoreColor(
                                        globalStats.overallAverage
                                    )}`}
                                >
                                    {formatPercentage(
                                        globalStats.overallAverage
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completion Rate
                                </p>
                                <p
                                    className={`text-2xl font-bold ${getProgressColor(
                                        globalStats.averageCompletion
                                    )}`}
                                >
                                    {formatPercentage(
                                        globalStats.averageCompletion
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Grading Grids</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAndSortedGrids.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                No results
                            </h3>
                            <p className="text-muted-foreground">
                                No grids match your filter criteria.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grid</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Average /20</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedGrids.map((grid) => {
                                    return (
                                        <TableRow key={grid.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {grid.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {grid.criteria.length}{' '}
                                                        criteria
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="flex items-center gap-1 w-fit"
                                                >
                                                    {getTypeIcon(grid.type)}
                                                    {getTypeLabel(grid.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getModeIcon(
                                                        grid.notationMode
                                                    )}
                                                    <span className="text-sm">
                                                        {grid.notationMode ===
                                                            'group' ||
                                                        grid.notationMode ===
                                                            'groupe'
                                                            ? 'Group'
                                                            : 'Individual'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {grid.isValidated ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="flex items-center gap-1 w-fit"
                                                    >
                                                        <CheckCircle className="h-3 w-3" />
                                                        Validated
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="flex items-center gap-1 w-fit"
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        Draft
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span
                                                                className={`text-sm font-medium ${getProgressColor(
                                                                    grid.completionRate
                                                                )}`}
                                                            >
                                                                {grid.completionRate.toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    grid.totalResults
                                                                }
                                                                /
                                                                {
                                                                    grid
                                                                        .criteria
                                                                        .length
                                                                }
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`w-full ${getProgressBgColor(
                                                                grid.completionRate
                                                            )} rounded-full h-2`}
                                                        >
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                                    grid.completionRate ===
                                                                    100
                                                                        ? 'bg-green-500'
                                                                        : grid.completionRate <=
                                                                            25
                                                                          ? 'bg-red-500'
                                                                          : grid.completionRate <=
                                                                              50
                                                                            ? 'bg-yellow-500'
                                                                            : grid.completionRate <=
                                                                                75
                                                                              ? 'bg-yellow-400'
                                                                              : 'bg-green-500'
                                                                }`}
                                                                style={{
                                                                    width: `${grid.completionRate}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div
                                                        className={`text-lg font-semibold ${getScoreColor(
                                                            grid.averageScore
                                                        )}`}
                                                    >
                                                        {grid.averageScore.toFixed(
                                                            1
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        / 20
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {onViewGrid && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                onViewGrid(grid)
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
