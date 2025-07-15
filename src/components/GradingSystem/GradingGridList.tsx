import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    FileText,
    Users,
    User,
    RefreshCw,
} from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import {
    GradingGrid,
    GradingGridType,
    NotationMode,
} from '@/components/GradingSystem/type'
import { formatPercentage } from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'

interface GradingGridListProps {
    projectId: string
    onCreateGrid?: () => void
    onEditGrid?: (grid: GradingGrid) => void
    onViewGrid?: (grid: GradingGrid) => void
    onDeleteGrid?: (grid: GradingGrid) => void
}

type FilterType = 'all' | GradingGridType
type FilterStatus = 'all' | 'validated' | 'draft'
type FilterMode = 'all' | NotationMode

export const GradingGridList: React.FC<GradingGridListProps> = ({
    projectId,
    onCreateGrid,
    onEditGrid,
    onViewGrid,
    onDeleteGrid,
}) => {
    const { grids, loading, error, deleteGrid, clearError, loadProjectGrids } =
        useGradingGrid({
            projectId,
        })

    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Auto-refresh functionality
    useEffect(() => {
        if (!projectId) return

        // Set up auto-refresh every 30 seconds
        intervalRef.current = setInterval(() => {
            loadProjectGrids(projectId)
        }, 30000)

        // Cleanup interval on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [projectId, loadProjectGrids])

    // Filtrage des grilles
    const safeGrids = Array.isArray(grids) ? grids : []
    const filteredGrids = safeGrids.filter((grid) => {
        const matchesSearch = grid.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || grid.type === filterType
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'validated' && grid.isValidated) ||
            (filterStatus === 'draft' && !grid.isValidated)
        const matchesMode =
            filterMode === 'all' || grid.notationMode === filterMode

        return matchesSearch && matchesType && matchesStatus && matchesMode
    })

    // Tri des grilles par date de création (plus récent en premier)
    const sortedGrids = filteredGrids.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA // Tri décroissant (plus récent en premier)
    })

    const safeFilteredGrids = Array.isArray(sortedGrids) ? sortedGrids : []

    const handleDelete = async (grid: GradingGrid) => {
        if (
            window.confirm(
                `Êtes-vous sûr de vouloir supprimer la grille "${grid.title}" ?`
            )
        ) {
            try {
                await deleteGrid(grid.id)
                // Refresh the grid list immediately after deletion
                await loadProjectGrids(projectId)
                if (onDeleteGrid) {
                    onDeleteGrid(grid)
                }
            } catch (err) {
                console.error('Erreur lors de la suppression:', err)
            }
        }
    }

    // Manual refresh function
    const handleRefresh = async () => {
        if (projectId) {
            await loadProjectGrids(projectId)
        }
    }

    const getTypeIcon = (type: GradingGridType) => {
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
    }

    const getTypeLabel = (type: GradingGridType) => {
        switch (type) {
            case 'livrable':
                return 'Deliverable'
            case 'rapport':
                return 'Report'
            case 'soutenance':
                return 'Presentation'
            default:
                return type
        }
    }

    const getModeIcon = (mode: NotationMode) => {
        return mode === 'groupe' ? (
            <Users className="h-4 w-4" />
        ) : (
            <User className="h-4 w-4" />
        )
    }

    const getModeLabel = (mode: NotationMode) => {
        return mode === 'groupe' ? 'By Group' : 'Individual'
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading grids...</span>
                    </div>
                </CardContent>
            </Card>
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Grading Grids</h2>
                    <p className="text-muted-foreground">
                        Manage grading grids for this project • Auto-refreshes
                        every 30s
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                    {onCreateGrid && (
                        <Button onClick={onCreateGrid}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Grid
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtres et recherche */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for a grid..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

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
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="livrable">
                                    Deliverable
                                </SelectItem>
                                <SelectItem value="rapport">Report</SelectItem>
                                <SelectItem value="soutenance">
                                    Presentation
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
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="validated">
                                    Validated
                                </SelectItem>
                                <SelectItem value="draft">Drafts</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterMode}
                            onValueChange={(value: FilterMode) =>
                                setFilterMode(value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modes</SelectItem>
                                <SelectItem value="groupe">By Group</SelectItem>
                                <SelectItem value="individuel">
                                    Individual
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des grilles */}
            {safeFilteredGrids.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                            <h3 className="text-xl font-semibold mb-3">
                                {safeGrids.length === 0
                                    ? 'Aucune grille créée'
                                    : 'No results found'}
                            </h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                {safeGrids.length === 0
                                    ? 'Grading grids allow you to evaluate deliverables, reports and presentations of your students in a structured and consistent manner. Create your first grid to start the evaluation.'
                                    : 'No grids match your search criteria. Try modifying the filters or search to display more results.'}
                            </p>
                            {grids.length === 0 ? (
                                onCreateGrid && (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={onCreateGrid}
                                            size="lg"
                                            className="w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Grid
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            You can define custom evaluation
                                            criteria
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm('')
                                            setFilterType('all')
                                            setFilterStatus('all')
                                            setFilterMode('all')
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Reset Filters
                                    </Button>
                                    {onCreateGrid && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Or create a new grid:
                                            </p>
                                            <Button
                                                onClick={onCreateGrid}
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                New Grid
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {safeFilteredGrids.map((grid) => {
                        const completionRate =
                            Array.isArray(grid.results) &&
                            Array.isArray(grid.criteria) &&
                            grid.results.length > 0 &&
                            grid.criteria.length > 0
                                ? (grid.results.length / grid.criteria.length) *
                                  100
                                : 0

                        return (
                            <Card
                                key={grid.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            {getTypeIcon(grid.type)}
                                            <CardTitle className="text-base line-clamp-2">
                                                {grid.title}
                                            </CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {onViewGrid && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onViewGrid(grid)
                                                        }
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                )}
                                                {onEditGrid &&
                                                    !grid.isValidated && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                onEditGrid(grid)
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                {onDeleteGrid &&
                                                    !grid.isValidated && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDelete(
                                                                    grid
                                                                )
                                                            }
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            {getTypeIcon(grid.type)}
                                            {getTypeLabel(grid.type)}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            {getModeIcon(grid.notationMode)}
                                            {getModeLabel(grid.notationMode)}
                                        </Badge>
                                        {grid.isValidated ? (
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                Validated
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="flex items-center gap-1"
                                            >
                                                <Clock className="h-3 w-3" />
                                                Draft
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Statistiques */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Criteria:
                                            </span>
                                            <span className="font-medium">
                                                {grid.criteria.length}
                                            </span>
                                        </div>

                                        {Array.isArray(grid.results) &&
                                            grid.results.length > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Progress:
                                                    </span>
                                                    <span className="font-medium">
                                                        {formatPercentage(
                                                            completionRate
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                    </div>

                                    {/* Dates */}
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {grid.createdAt && (
                                            <div>
                                                Created:{' '}
                                                {new Date(
                                                    grid.createdAt
                                                ).toLocaleDateString('en-US')}
                                            </div>
                                        )}
                                        {grid.updatedAt &&
                                            grid.updatedAt !==
                                                grid.createdAt && (
                                                <div>
                                                    Modified:{' '}
                                                    {new Date(
                                                        grid.updatedAt
                                                    ).toLocaleDateString(
                                                        'en-US'
                                                    )}
                                                </div>
                                            )}
                                    </div>

                                    {/* Actions rapides */}
                                    <div className="flex gap-2 pt-2">
                                        {onViewGrid && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewGrid(grid)}
                                                className="flex-1"
                                            >
                                                View
                                            </Button>
                                        )}
                                        {onEditGrid && !grid.isValidated && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditGrid(grid)}
                                                className="flex-1"
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Statistiques globales */}
            {safeGrids.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    Total:
                                </span>
                                <div className="font-medium text-lg">
                                    {grids.length}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Validated:
                                </span>
                                <div className="font-medium text-lg text-green-600">
                                    {grids.filter((g) => g.isValidated).length}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Drafts:
                                </span>
                                <div className="font-medium text-lg text-orange-600">
                                    {grids.filter((g) => !g.isValidated).length}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Validation Rate:
                                </span>
                                <div className="font-medium text-lg">
                                    {grids.length > 0
                                        ? formatPercentage(
                                              (grids.filter(
                                                  (g) => g.isValidated
                                              ).length /
                                                  grids.length) *
                                                  100
                                          )
                                        : '0%'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
