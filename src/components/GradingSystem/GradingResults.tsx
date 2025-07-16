import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    Download,
    Eye,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import {
    GradingGrid,
    GradingGridType,
    NotationMode,
} from '@/components/GradingSystem/type'
import {
    formatPercentage,
    calculateFinalGrade,
    calculateGradingStats,
} from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'

interface GradingResultsProps {
    projectId: string
    onViewGrid?: (grid: GradingGrid) => void
    onExportResults?: (grid: GradingGrid) => void
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
    onExportResults,
}) => {
    const { grids, loading, error, loadProjectGrids } = useGradingGrid({
        projectId,
    })

    const [filterType, setFilterType] = useState<FilterType>('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('validated')
    const [sortBy, setSortBy] = useState<SortBy>('date')

    // Calcul des statistiques pour chaque grille avec useMemo pour optimiser les performances
    const gridsWithStats: GridWithStats[] = useMemo(() => {
        return grids.map((grid) => {
            const stats = calculateGradingStats(grid.criteria, grid.results)
            const totalPossibleResults = grid.criteria.length
            const actualResults = (grid.results || []).length

            // Clamp la progression à 100 max
            const rawCompletion =
                totalPossibleResults > 0
                    ? (actualResults / totalPossibleResults) * 100
                    : 0
            const completionRate = Math.min(rawCompletion, 100)

            return {
                ...grid,
                averageScore: stats.weightedScore,
                completionRate,
                totalResults: actualResults,
            }
        })
    }, [grids])

    // Filtrage et tri avec useMemo pour éviter les recalculs inutiles
    const filteredAndSortedGrids = useMemo(() => {
        return gridsWithStats
            .filter((grid) => {
                const matchesType =
                    filterType === 'all' || grid.type === filterType
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

    // Statistiques globales avec useMemo pour optimiser les calculs
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

    const getTypeIcon = useCallback((type: GradingGridType) => {
        switch (type) {
            case 'livrable':
                return <FileText className="h-4 w-4" />
            case 'rapport':
                return <FileText className="h-4 w-4" />
            case 'soutenance':
                return <Users className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }, [])

    const getTypeLabel = useCallback((type: GradingGridType) => {
        switch (type) {
            case 'livrable':
                return 'Livrable'
            case 'rapport':
                return 'Rapport'
            case 'soutenance':
                return 'Soutenance'
            default:
                return type
        }
    }, [])

    const getModeIcon = useCallback((mode: NotationMode) => {
        return mode === 'groupe' ? (
            <Users className="h-4 w-4" />
        ) : (
            <User className="h-4 w-4" />
        )
    }, [])

    const getScoreTrend = useCallback((score: number) => {
        if (score >= 80)
            return <TrendingUp className="h-4 w-4 text-green-500" />
        if (score >= 60) return <Minus className="h-4 w-4 text-yellow-500" />
        return <TrendingDown className="h-4 w-4 text-red-500" />
    }, [])

    const getScoreColor = useCallback((score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }, [])

    // ====== UI Render ======
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">
                            Chargement des résultats...
                        </span>
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
            {/* En-tête */}
            <div>
                <h2 className="text-2xl font-bold">Résultats de notation</h2>
                <p className="text-muted-foreground">
                    Consultez les résultats et statistiques des grilles de
                    notation
                </p>
            </div>

            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total grilles
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
                                    Validées
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
                                    Moyenne générale
                                </p>
                                <p className="text-2xl font-bold">
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
                                    Taux de completion
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatPercentage(
                                        globalStats.averageCompletion
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            value={filterType}
                            onValueChange={(value: FilterType) =>
                                setFilterType(value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tous les types
                                </SelectItem>
                                <SelectItem value="livrable">
                                    Livrable
                                </SelectItem>
                                <SelectItem value="rapport">Rapport</SelectItem>
                                <SelectItem value="soutenance">
                                    Soutenance
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterStatus}
                            onValueChange={(value: FilterStatus) =>
                                setFilterStatus(value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Tous les statuts
                                </SelectItem>
                                <SelectItem value="validated">
                                    Validées
                                </SelectItem>
                                <SelectItem value="draft">
                                    Brouillons
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={sortBy}
                            onValueChange={(value: SortBy) => setSortBy(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Trier par" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">
                                    Date de modification
                                </SelectItem>
                                <SelectItem value="title">Titre</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                                <SelectItem value="average">Moyenne</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des résultats */}
            <Card>
                <CardHeader>
                    <CardTitle>Grilles de notation</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAndSortedGrids.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                Aucun résultat
                            </h3>
                            <p className="text-muted-foreground">
                                Aucune grille ne correspond à vos critères de
                                filtrage.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grille</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Progression</TableHead>
                                    <TableHead>Moyenne</TableHead>
                                    <TableHead>Note /20</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedGrids.map((grid) => {
                                    // Couleur dynamique pour la barre de progression (rouge à vert)
                                    const percent = grid.completionRate / 100
                                    const r = Math.round(255 * (1 - percent))
                                    const g = Math.round(255 * percent)
                                    const b = 0
                                    const progressColor = `rgb(${r},${g},${b})`
                                    const finalGrade = calculateFinalGrade(
                                        grid.criteria,
                                        grid.results
                                    )

                                    return (
                                        <TableRow key={grid.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {grid.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {grid.criteria.length}{' '}
                                                        critères
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
                                                        'groupe'
                                                            ? 'Groupe'
                                                            : 'Individuel'}
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
                                                        Validée
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="flex items-center gap-1 w-fit"
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        Brouillon
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span>
                                                            {grid.totalResults}/
                                                            {
                                                                grid.criteria
                                                                    .length
                                                            }
                                                        </span>
                                                        <span>
                                                            {formatPercentage(
                                                                grid.completionRate
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            grid.completionRate
                                                        }
                                                        indicatorStyle={{
                                                            backgroundColor:
                                                                progressColor,
                                                        }}
                                                        className="progress-gradient-bar h-2"
                                                    />
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div
                                                    className={`flex items-center gap-1 ${getScoreColor(grid.averageScore)}`}
                                                >
                                                    {getScoreTrend(
                                                        grid.averageScore
                                                    )}
                                                    <span className="font-medium">
                                                        {formatPercentage(
                                                            grid.averageScore
                                                        )}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className={`font-medium ${getScoreColor(grid.averageScore)}`}
                                                >
                                                    {finalGrade.toFixed(1)}/20
                                                </span>
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
                                                    {onExportResults && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                onExportResults(
                                                                    grid
                                                                )
                                                            }
                                                        >
                                                            <Download className="h-4 w-4" />
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
