import React, { useState } from 'react'
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
import { GradingGrid, GradingGridType, NotationMode } from '@/types/grading'
import { formatPercentage } from '@/utils/gradingCalculations'
import { ErrorDisplay } from '@/components/ui/error-display'

interface GradingGridListProps {
    projectId: string
    onCreateGrid?: () => void
    onEditGrid?: (grid: GradingGrid) => void
    onViewGrid?: (grid: GradingGrid) => void
    onDeleteGrid?: (grid: GradingGrid) => void
    showFilters?: boolean
    showOnlyValidated?: boolean
    showOnlyDrafts?: boolean
    // External filter props
    externalFilterType?: FilterType
    externalFilterStatus?: FilterStatus
    externalFilterMode?: FilterMode
    externalSortBy?: string
    externalSearchTerm?: string
}

export type FilterType = 'all' | GradingGridType
export type FilterStatus = 'all' | 'validated' | 'draft'
export type FilterMode = 'all' | NotationMode

export const GradingGridList: React.FC<GradingGridListProps> = ({
    projectId,
    onCreateGrid,
    onEditGrid,
    onViewGrid,
    onDeleteGrid,
    showFilters = true,
    showOnlyValidated = false,
    showOnlyDrafts = false,
    externalFilterType,
    externalFilterMode,
    externalSortBy,
    externalSearchTerm,
}) => {
    const { grids, loading, error, deleteGrid, clearError, loadProjectGrids } =
        useGradingGrid({
            projectId,
        })

    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('all')

    const [filterMode, setFilterMode] = useState<FilterMode>('all')

    const safeGrids = Array.isArray(grids) ? grids : []

    // Use external filters if provided, otherwise use internal state
    const activeFilterType = externalFilterType ?? filterType

    const activeFilterMode = externalFilterMode ?? filterMode
    const activeSortBy = externalSortBy ?? 'date'
    const activeSearchTerm = externalSearchTerm ?? searchTerm

    const filteredGrids = safeGrids.filter((grid) => {
        const matchesSearch = (grid.title || '')
            .toLowerCase()
            .includes(activeSearchTerm.toLowerCase())
        const typeEquivalents = {
            deliverable: ['deliverable', 'livrable'],
            report: ['report', 'rapport'],
            presentation: ['presentation', 'soutenance', 'oralpresentation'],
        }
        const equiv =
            activeFilterType === 'all'
                ? []
                : typeEquivalents[
                      activeFilterType as keyof typeof typeEquivalents
                  ] || []
        const matchesType =
            activeFilterType === 'all' || equiv.includes(grid.type)

        const matchesMode =
            activeFilterMode === 'all' || grid.notationMode === activeFilterMode

        // Apply prop-based filtering
        const matchesValidationFilter =
            (!showOnlyValidated && !showOnlyDrafts) ||
            (showOnlyValidated && grid.isValidated) ||
            (showOnlyDrafts && !grid.isValidated)

        return (
            matchesSearch &&
            matchesType &&
            matchesMode &&
            matchesValidationFilter
        )
    })

    const sortedGrids = filteredGrids.sort((a, b) => {
        switch (activeSortBy) {
            case 'title':
                return a.title.localeCompare(b.title)
            case 'type':
                return a.type.localeCompare(b.type)
            case 'average': {
                // Sort by average score if available
                const avgA =
                    Array.isArray(a.results) && a.results.length > 0
                        ? a.results.reduce(
                              (sum, r) => sum + (r.score || 0),
                              0
                          ) / a.results.length
                        : 0
                const avgB =
                    Array.isArray(b.results) && b.results.length > 0
                        ? b.results.reduce(
                              (sum, r) => sum + (r.score || 0),
                              0
                          ) / b.results.length
                        : 0
                return avgB - avgA
            }
            case 'date':
            default: {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return dateB - dateA
            }
        }
    })

    const safeFilteredGrids = Array.isArray(sortedGrids) ? sortedGrids : []

    const handleDelete = async (grid: GradingGrid) => {
        if (
            window.confirm(
                `Are you sure you want to delete the grid "${grid.title}" ?`
            )
        ) {
            try {
                await deleteGrid(grid.id)

                await loadProjectGrids(projectId)
                if (onDeleteGrid) {
                    onDeleteGrid(grid)
                }
            } catch (err) {
                console.error('Error during deletion:', err)
            }
        }
    }

    const handleRefresh = async () => {
        if (projectId) {
            await loadProjectGrids(projectId)
        }
    }

    const getTypeIcon = (type: GradingGridType) => {
        switch (type) {
            case 'deliverable':
                return <FileText className="h-4 w-4" />
            case 'report':
                return <FileText className="h-4 w-4" />
            case 'presentation':
                return <Users className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const getTypeLabel = (type: GradingGridType) => {
        switch (type) {
            case 'deliverable':
                return 'Deliverable'
            case 'report':
                return 'Report'
            case 'presentation':
                return 'Presentation'
            default:
                return type
        }
    }

    const getModeIcon = (mode: NotationMode) => {
        return mode === 'group' ? (
            <Users className="h-4 w-4" />
        ) : (
            <User className="h-4 w-4" />
        )
    }

    const getModeLabel = (mode: NotationMode) => {
        return mode === 'group' ? 'By Group' : 'Individual'
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
            {showFilters && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Grading Grids
                            </h2>
                            <p className="text-muted-foreground">
                                Manage grading grids for this project
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
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search grids by title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <Select
                                value={filterType}
                                onValueChange={(value: FilterType) =>
                                    setFilterType(value)
                                }
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="deliverable">
                                        Deliverable
                                    </SelectItem>
                                    <SelectItem value="report">
                                        Report
                                    </SelectItem>
                                    <SelectItem value="presentation">
                                        Presentation
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterMode}
                                onValueChange={(value: FilterMode) =>
                                    setFilterMode(value)
                                }
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Modes
                                    </SelectItem>
                                    <SelectItem value="individual">
                                        Individual
                                    </SelectItem>
                                    <SelectItem value="group">Group</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* Liste des grilles */}
            {safeFilteredGrids.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="max-w-lg mx-auto">
                            <div className="mb-6">
                                <div className="relative">
                                    <FileText className="h-20 w-20 mx-auto text-muted-foreground/50 mb-4" />
                                    <div className="absolute -top-2 -right-2 bg-primary/10 rounded-full p-2">
                                        <Plus className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mb-3 text-foreground">
                                {safeGrids.length === 0
                                    ? 'Ready to Start Grading?'
                                    : showOnlyDrafts
                                      ? 'No Grids Available'
                                      : 'No results found'}
                            </h3>

                            <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                                {safeGrids.length === 0
                                    ? 'Create your first grading grid to evaluate student work with structured criteria. Define custom evaluation standards for deliverables, reports, and presentations.'
                                    : showOnlyDrafts
                                      ? 'Create a new grid and give notes to start grading. All validated grids can be found in the "Gradings" section.'
                                      : 'No grids match your search criteria. Try modifying the filters or search to display more results.'}
                            </p>

                            {safeGrids.length === 0 ? (
                                onCreateGrid && (
                                    <div className="space-y-6">
                                        <Button
                                            onClick={onCreateGrid}
                                            size="lg"
                                            className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            <Plus className="h-5 w-5 mr-3" />
                                            Create Your First Grading Grid
                                        </Button>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-sm">
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <div className="font-semibold text-foreground mb-2">
                                                    📝 Define Criteria
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Set up evaluation standards
                                                    and point values
                                                </div>
                                            </div>
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <div className="font-semibold text-foreground mb-2">
                                                    ⚖️ Weight Importance
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Assign weights to different
                                                    criteria
                                                </div>
                                            </div>
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <div className="font-semibold text-foreground mb-2">
                                                    🎯 Grade Consistently
                                                </div>
                                                <div className="text-muted-foreground">
                                                    Ensure fair and structured
                                                    evaluations
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-4">
                                            💡 Tip: Start with a simple grid and
                                            refine it as you go
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-3">
                                    {onCreateGrid && (
                                        <Button
                                            onClick={onCreateGrid}
                                            className="w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Grid
                                        </Button>
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

                                    {/* Criteria Details */}
                                    {grid.criteria &&
                                        grid.criteria.length > 0 && (
                                            <div className="space-y-2">
                                                {grid.criteria.map(
                                                    (criterion) => (
                                                        <div
                                                            key={criterion.id}
                                                            className="p-3 bg-muted/50 rounded text-sm space-y-2"
                                                        >
                                                            <div className="font-medium text-foreground break-words">
                                                                {
                                                                    criterion.label
                                                                }
                                                            </div>
                                                            <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="font-medium">
                                                                        {
                                                                            criterion.maxPoints
                                                                        }
                                                                    </span>
                                                                    <span>
                                                                        pts
                                                                    </span>
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span>
                                                                        Weight:
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        {
                                                                            criterion.weight
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

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
                                                {grid.isValidated
                                                    ? 'View'
                                                    : 'Give note'}
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
