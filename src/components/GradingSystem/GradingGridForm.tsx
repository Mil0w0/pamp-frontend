import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorDisplay } from '@/components/ui/error-display'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react'
import { useGradingGrid } from '@/hooks/useGradingGrid'
import {
    GradingGrid,
    GradingCriterion,
    CreateGradingGridDto,
    GradingGridType,
    NotationMode,
} from '@/components/GradingSystem/type'
import { formatScore, formatPercentage } from '@/utils/gradingCalculations'
import { Student } from '@/components/ManageStudentBatches/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { authService } from '@/services/UserService/auth-api-client'
import { groupService } from '@/services/ProjectService/project-api-client'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'

interface GradingGridFormProps {
    projectId: string
    gridId?: string
    type?: GradingGridType
    targetId?: string
    onSave?: (grid: GradingGrid) => void
    onCancel?: () => void
    readOnly?: boolean
}

// Helper pour vérifier si la grille locale est complète (création)
const isLocalGridComplete = (formData: {
    title: string
    targetId: string
    criteria: Array<{
        label: string
        maxPoints: number
        weight: number
    }>
}) => {
    return (
        !!formData.title.trim() &&
        !!formData.targetId &&
        Array.isArray(formData.criteria) &&
        formData.criteria.length > 0 &&
        formData.criteria.every(
            (c) => c.label && c.maxPoints > 0 && c.weight > 0
        )
    )
}

export const GradingGridForm: React.FC<GradingGridFormProps> = memo(
    ({
        projectId,
        gridId,
        type,
        targetId,
        onSave,
        onCancel,
        readOnly = false,
    }) => {
        const {
            grid,
            loading,
            saving,
            error,
            stats,
            createGrid,
            updateGrid,
            addCriterion,
            updateCriterion,
            removeCriterion,
            clearError,
            isGridComplete,
        } = useGradingGrid({ projectId, gridId, type, targetId })

        const [formData, setFormData] = useState({
            title: '',
            notationMode: 'groupe' as NotationMode,
            type: type || ('livrable' as GradingGridType),
            targetId: targetId || '',
            criteria: [] as GradingCriterion[],
        })

        const [newCriterion, setNewCriterion] = useState({
            label: '',
            maxPoints: 20,
            weight: 1,
            commentEnabled: false,
        })

        const [students, setStudents] = useState<Student[]>([])
        const [groups, setGroups] = useState<ProjectGroup[]>([])
        const [loadingTargets, setLoadingTargets] = useState(false)

        const { currentProject } = useSelector(
            (state: RootState) => state.project
        )

        // Memoized batch student IDs
        const batchStudentIds = useMemo(() => {
            if (!currentProject?.studentBatch?.students) return []

            return typeof currentProject.studentBatch.students === 'string'
                ? currentProject.studentBatch.students
                      .split(',')
                      .map((id: string) => id.trim())
                : currentProject.studentBatch.students.map(
                      (s: { user_id: string }) => s.user_id
                  )
        }, [currentProject?.studentBatch?.students])

        // Fetch students
        const fetchStudents = useCallback(async () => {
            setLoadingTargets(true)
            try {
                const response = await authService.getStudents()
                if (response.success) {
                    const allStudents = response.data as Student[]
                    if (batchStudentIds.length > 0) {
                        const filteredStudents = allStudents.filter((student) =>
                            batchStudentIds.includes(student.user_id)
                        )
                        setStudents(filteredStudents)
                    } else {
                        setStudents(allStudents)
                    }
                }
            } catch (error) {
                console.error('Error fetching students:', error)
            } finally {
                setLoadingTargets(false)
            }
        }, [batchStudentIds])

        // Fetch groups
        const fetchGroups = useCallback(async () => {
            setLoadingTargets(true)
            try {
                const response = await groupService.getAll(projectId)
                if (response.success) {
                    setGroups(response.data as ProjectGroup[])
                }
            } catch (error) {
                console.error('Error fetching groups:', error)
            } finally {
                setLoadingTargets(false)
            }
        }, [projectId])

        // Sync form data with loaded grid
        useEffect(() => {
            if (grid) {
                setFormData({
                    title: grid.title,
                    notationMode: grid.notationMode,
                    type: grid.type,
                    targetId: grid.targetId,
                    criteria: grid.criteria || [],
                })
            }
        }, [grid])

        // Load students or groups based on notation mode
        useEffect(() => {
            if (formData.notationMode === 'individuel') {
                fetchStudents()
            } else if (formData.notationMode === 'groupe') {
                fetchGroups()
            }
        }, [formData.notationMode, fetchStudents, fetchGroups])

        // Memoized target options

        // Memoized form validation

        // Save handler
        const handleSave = useCallback(async () => {
            try {
                if (grid) {
                    // Utiliser les critères mis à jour de la grille actuelle
                    const updatedCriteria = grid.criteria || []
                    await updateGrid(grid.id, {
                        title: formData.title,
                        notationMode: formData.notationMode,
                        criteria: updatedCriteria,
                    })

                    // Vérifier si la mise à jour a échoué
                    if (error) {
                        alert('Error updating the grid: ' + error.message)
                        return
                    }

                    if (onSave) {
                        onSave({
                            ...grid,
                            title: formData.title,
                            notationMode: formData.notationMode,
                            criteria: updatedCriteria,
                        })
                    }
                } else {
                    const gridData: CreateGradingGridDto = {
                        projectId,
                        title: formData.title,
                        type: formData.type,
                        targetId: formData.targetId,
                        notationMode: formData.notationMode,
                        criteria: formData.criteria.map(
                            (criterion: GradingCriterion) => ({
                                label: criterion.label,
                                maxPoints: criterion.maxPoints,
                                weight: criterion.weight,
                                commentEnabled: criterion.commentEnabled,
                            })
                        ),
                    }
                    const newGrid = await createGrid(gridData)

                    // Vérifier si la création a échoué
                    if (!newGrid || error) {
                        alert(
                            'An error occurred while saving the grid: ' +
                                (error?.message || 'Unknown error')
                        )
                        return
                    }

                    if (onSave && newGrid) {
                        onSave(newGrid)
                    }
                }
            } catch (err) {
                console.error('An error occured while saving the grid:', err)
                alert(
                    'An error occurred while saving the grid: ' +
                        (err instanceof Error ? err.message : String(err))
                )
            }
        }, [grid, formData, updateGrid, createGrid, onSave, error])

        // Add criterion handler
        const handleAddCriterion = useCallback(() => {
            if (newCriterion.label.trim()) {
                if (grid) {
                    addCriterion(newCriterion)
                } else {
                    const newCriterionWithId = {
                        ...newCriterion,
                        id: `temp-${Date.now()}-${Math.random()}`,
                    }
                    setFormData((prev) => ({
                        ...prev,
                        criteria: [...prev.criteria, newCriterionWithId],
                    }))
                }
                setNewCriterion({
                    label: '',
                    maxPoints: 20,
                    weight: 1,
                    commentEnabled: false,
                })
            }
        }, [newCriterion, grid, addCriterion, setFormData])

        // Update criterion handler
        const handleUpdateCriterion = useCallback(
            (
                criterionId: string,
                field: keyof GradingCriterion,
                value: string | number | boolean
            ) => {
                if (grid) {
                    updateCriterion(criterionId, { [field]: value })
                } else {
                    setFormData((prev) => {
                        const criteria = prev.criteria.map((criterion) =>
                            criterion.id === criterionId
                                ? { ...criterion, [field]: value }
                                : criterion
                        )
                        return { ...prev, criteria }
                    })
                }
            },
            [grid, updateCriterion]
        )

        // Remove criterion handler
        const handleRemoveCriterion = useCallback(
            (criterionId: string) => {
                if (grid) {
                    removeCriterion(criterionId)
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        criteria: prev.criteria.filter(
                            (criterion) => criterion.id !== criterionId
                        ),
                    }))
                }
            },
            [grid, removeCriterion]
        )

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

        return (
            <div className="space-y-6">
                {error && (
                    <ErrorDisplay
                        error={error}
                        onRetry={() => window.location.reload()}
                        onDismiss={clearError}
                    />
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>
                                {grid
                                    ? 'Edit Grading Grid'
                                    : 'Create Grading Grid'}
                            </span>
                            {grid?.isValidated && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <CheckCircle className="h-3 w-3" />
                                    Validated
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Grid Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="Ex: Report grading grid"
                                    disabled={readOnly || grid?.isValidated}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notationMode">
                                    Grading Mode
                                </Label>
                                <Select
                                    value={formData.notationMode}
                                    onValueChange={(value: NotationMode) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            notationMode: value,
                                        }))
                                    }
                                    disabled={readOnly || grid?.isValidated}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="groupe">
                                            By Group
                                        </SelectItem>
                                        <SelectItem value="individuel">
                                            Individual
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!grid && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Evaluation Type
                                    </Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(
                                            value: GradingGridType
                                        ) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                type: value,
                                            }))
                                        }
                                        disabled={readOnly}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="livrable">
                                                Deliverable
                                            </SelectItem>
                                            <SelectItem value="rapport">
                                                Report
                                            </SelectItem>
                                            <SelectItem value="soutenance">
                                                Presentation
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetId">
                                        {formData.notationMode === 'groupe'
                                            ? 'Target Group'
                                            : 'Target Student'}
                                    </Label>
                                    <Select
                                        value={formData.targetId}
                                        onValueChange={(value: string) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                targetId: value,
                                            }))
                                        }
                                        disabled={readOnly || loadingTargets}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    loadingTargets
                                                        ? 'Loading...'
                                                        : formData.notationMode ===
                                                            'groupe'
                                                          ? 'Select a group'
                                                          : 'Select a student'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.notationMode === 'groupe'
                                                ? groups.map((group) => (
                                                      <SelectItem
                                                          key={group.id}
                                                          value={group.id}
                                                      >
                                                          {group.name}
                                                      </SelectItem>
                                                  ))
                                                : students.map((student) => (
                                                      <SelectItem
                                                          key={student.user_id}
                                                          value={
                                                              student.user_id
                                                          }
                                                      >
                                                          {student.first_name}{' '}
                                                          {student.last_name} (
                                                          {student.email})
                                                      </SelectItem>
                                                  ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {stats && grid && grid.criteria.length > 0 && (
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Statistics</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">
                                            Total Score:
                                        </span>
                                        <div className="font-medium">
                                            {formatScore(
                                                stats.totalScore,
                                                stats.maxScore
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Percentage:
                                        </span>
                                        <div className="font-medium">
                                            {formatPercentage(stats.percentage)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Weighted Score:
                                        </span>
                                        <div className="font-medium">
                                            {formatPercentage(
                                                stats.weightedScore
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            Score out of 20:
                                        </span>
                                        <div className="font-medium">
                                            {(
                                                (stats.weightedScore / 100) *
                                                20
                                            ).toFixed(1)}
                                            /20
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Grading Criteria */}
                <Card>
                    <CardHeader>
                        <CardTitle>Grading Criteria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(grid?.criteria || formData.criteria).map(
                            (criterion: GradingCriterion, idx: number) => (
                                <div
                                    key={criterion.id || idx}
                                    className="flex items-center gap-4"
                                >
                                    {!readOnly && !grid?.isValidated ? (
                                        <>
                                            <Input
                                                value={criterion.label}
                                                onChange={(e) =>
                                                    handleUpdateCriterion(
                                                        criterion.id,
                                                        'label',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-32"
                                                placeholder="Criteria"
                                            />
                                            <Input
                                                type="number"
                                                value={criterion.maxPoints}
                                                min={1}
                                                onChange={(e) =>
                                                    handleUpdateCriterion(
                                                        criterion.id,
                                                        'maxPoints',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-24"
                                                placeholder="Max Points"
                                            />
                                            <Input
                                                type="number"
                                                value={criterion.weight}
                                                min={1}
                                                onChange={(e) =>
                                                    handleUpdateCriterion(
                                                        criterion.id,
                                                        'weight',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-24"
                                                placeholder="Weight"
                                            />
                                            <div className="flex items-center gap-1">
                                                <Label
                                                    htmlFor={`commentEnabled-${criterion.id}`}
                                                >
                                                    Comment
                                                </Label>
                                                <Switch
                                                    id={`commentEnabled-${criterion.id}`}
                                                    checked={
                                                        criterion.commentEnabled
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        handleUpdateCriterion(
                                                            criterion.id,
                                                            'commentEnabled',
                                                            checked
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemoveCriterion(
                                                        criterion.id
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-medium">
                                                {criterion.label}
                                            </span>
                                            <span>
                                                Max Points:{' '}
                                                {criterion.maxPoints}
                                            </span>
                                            <span>
                                                Weight: {criterion.weight}
                                            </span>
                                            <span>
                                                Comment Enabled:{' '}
                                                {criterion.commentEnabled
                                                    ? 'Yes'
                                                    : 'No'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )
                        )}

                        {!readOnly && !grid?.isValidated && (
                            <div className="flex flex-col md:flex-row items-center gap-2 pt-4 border-t w-full">
                                <div className="flex flex-col w-full md:w-32">
                                    <Label htmlFor="new-criterion-label">
                                        Label
                                    </Label>
                                    <Input
                                        id="new-criterion-label"
                                        placeholder="Criterion label"
                                        value={newCriterion.label}
                                        onChange={(e) =>
                                            setNewCriterion((prev) => ({
                                                ...prev,
                                                label: e.target.value,
                                            }))
                                        }
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex flex-col w-full md:w-24">
                                    <Label htmlFor="new-criterion-maxpoints">
                                        Max Points
                                    </Label>
                                    <Input
                                        id="new-criterion-maxpoints"
                                        placeholder="Max points"
                                        type="number"
                                        value={newCriterion.maxPoints}
                                        min={1}
                                        onChange={(e) =>
                                            setNewCriterion((prev) => ({
                                                ...prev,
                                                maxPoints: Number(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex flex-col w-full md:w-24">
                                    <Label htmlFor="new-criterion-weight">
                                        Weight
                                    </Label>
                                    <Input
                                        id="new-criterion-weight"
                                        placeholder="Weight (e.g. 1 or 0.3)"
                                        type="number"
                                        value={newCriterion.weight}
                                        min={1}
                                        onChange={(e) =>
                                            setNewCriterion((prev) => ({
                                                ...prev,
                                                weight: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Label htmlFor="commentEnabled">
                                        Comment
                                    </Label>
                                    <Switch
                                        id="commentEnabled"
                                        checked={newCriterion.commentEnabled}
                                        onCheckedChange={(checked) =>
                                            setNewCriterion((prev) => ({
                                                ...prev,
                                                commentEnabled: checked,
                                            }))
                                        }
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddCriterion}
                                    variant="outline"
                                    className="flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-6">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    )}
                    {!readOnly && (
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={
                                saving ||
                                grid?.isValidated ||
                                (!grid
                                    ? !isLocalGridComplete(formData)
                                    : !isGridComplete)
                            }
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {grid ? 'Save Changes' : 'Create Grid'}
                        </Button>
                    )}
                </div>
            </div>
        )
    }
)

export default GradingGridForm
