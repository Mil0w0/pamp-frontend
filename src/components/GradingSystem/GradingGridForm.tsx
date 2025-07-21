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
    GradingGridType,
    NotationMode,
    CreateGradingGridDto,
    UpdateGradingGridDto,
} from '@/types/grading'
import { formatScore, formatPercentage } from '@/utils/gradingCalculations'
import { Student } from '@/components/ManageStudentBatches/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { authService } from '@/services/UserService/auth-api-client'
import { groupService } from '@/services/ProjectService/project-api-client'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/index'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table'
import { Progress } from '../ui/progress'

const mapNotationModeToApi = (mode: NotationMode): NotationMode => {
    switch (mode) {
        case 'group':
            return 'groupe'
        case 'individual':
            return 'individuel'
        default:
            return mode
    }
}

const mapTypeToApi = (type: GradingGridType): GradingGridType => {
    switch (type) {
        case 'deliverable':
            return 'livrable'
        case 'report':
            return 'rapport'
        case 'presentation':
            return 'soutenance'
        default:
            return type
    }
}

interface GradingGridFormProps {
    projectId: string
    gridId?: string
    type?: GradingGridType
    targetId?: string
    onSave?: (grid: GradingGrid) => void
    onCancel?: () => void
    readOnly?: boolean
}

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
            notationMode: 'group' as NotationMode,
            type: type || ('deliverable' as GradingGridType),
            targetId: targetId || '',
            criteria: [] as GradingCriterion[],
        })

        const [newCriterion, setNewCriterion] = useState({
            label: '',
            maxPoints: 20,
            weight: 1,
            commentEnabled: false,
        })

        const [applyToAllGroups, setApplyToAllGroups] = useState(false)
        const [students, setStudents] = useState<Student[]>([])
        const [groups, setGroups] = useState<ProjectGroup[]>([])
        const [loadingTargets, setLoadingTargets] = useState(false)
        const { currentProject } = useSelector(
            (state: RootState) => state?.project || {}
        )

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
                // Silence error
                console.log(error)
            } finally {
                setLoadingTargets(false)
            }
        }, [batchStudentIds])

        const fetchGroups = useCallback(async () => {
            setLoadingTargets(true)
            try {
                const response = await groupService.getAll(projectId)
                if (response.success) {
                    setGroups(response.data as ProjectGroup[])
                }
            } catch (error) {
                // Silence error
                console.log(error)
            } finally {
                setLoadingTargets(false)
            }
        }, [projectId])

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

        useEffect(() => {
            if (formData.notationMode === 'individual') {
                fetchStudents()
            } else if (
                formData.notationMode === 'group' ||
                formData.notationMode === 'groupe'
            ) {
                fetchGroups()
            }
        }, [formData.notationMode, fetchStudents, fetchGroups])

        const handleSave = useCallback(async () => {
            if (saving) return
            if (!formData.title.trim()) {
                toast.error('Grid title is required')
                return
            }
            if (!formData.targetId) {
                toast.error('Target selection is required')
                return
            }
            if (formData.criteria.length === 0) {
                toast.error('At least one criterion is required')
                return
            }
            const invalidCriteria = formData.criteria.find(
                (c) => !c.label.trim() || c.maxPoints <= 0 || c.weight <= 0
            )
            if (invalidCriteria) {
                toast.error(
                    'All criteria must have a label, positive max points, and positive weight'
                )
                return
            }
            try {
                if (grid) {
                    const originalCriteria = grid.criteria || []
                    const updatedCriteria = formData.criteria
                    const updates: Partial<UpdateGradingGridDto> = {}
                    if (grid.title !== formData.title) {
                        updates.title = formData.title
                    }
                    const mappedMode = mapNotationModeToApi(
                        formData.notationMode
                    )
                    if (grid.notationMode !== mappedMode) {
                        updates.notationMode = mappedMode
                    }
                    if (Object.keys(updates).length > 0) {
                        await updateGrid(grid.id, updates)
                    }
                    const criteriaToAdd = updatedCriteria.filter((c) =>
                        c.id?.startsWith('temp-')
                    )
                    const criteriaToRemove = originalCriteria.filter(
                        (oc) => !updatedCriteria.some((uc) => uc.id === oc.id)
                    )
                    const criteriaToUpdate = updatedCriteria.filter((uc) => {
                        if (!uc.id || uc.id.startsWith('temp-')) return false
                        const original = originalCriteria.find(
                            (oc) => oc.id === uc.id
                        )
                        return (
                            original &&
                            (original.label !== uc.label ||
                                original.maxPoints !== uc.maxPoints ||
                                original.weight !== uc.weight ||
                                original.commentEnabled !== uc.commentEnabled)
                        )
                    })
                    const results = await Promise.allSettled([
                        ...criteriaToRemove.map((c) =>
                            removeCriterion(grid.id, c.id)
                        ),
                        ...criteriaToAdd.map((c) => {
                            const criterionData: Omit<GradingCriterion, 'id'> =
                                {
                                    label: c.label,
                                    maxPoints: c.maxPoints,
                                    weight: c.weight,
                                    commentEnabled: c.commentEnabled,
                                }
                            return addCriterion(grid.id, criterionData)
                        }),
                        ...criteriaToUpdate.map((c) => {
                            const { id, ...data } = c
                            return updateCriterion(grid.id, id, data)
                        }),
                    ])
                    const failed = results.some(
                        (result) => result.status === 'rejected'
                    )
                    if (failed) {
                        toast.error(
                            'An error occurred while updating the grid criteria.'
                        )
                    } else {
                        toast.success('Grid updated successfully!')
                        if (onSave) {
                            const updatedGrid = { ...grid, ...formData }
                            onSave(updatedGrid)
                        }
                    }
                } else {
                    const newGridData: CreateGradingGridDto = {
                        ...formData,
                        projectId,
                        notationMode: mapNotationModeToApi(
                            formData.notationMode
                        ),
                        type: mapTypeToApi(formData.type),
                        criteria: formData.criteria.map(
                            (criterion): Omit<GradingCriterion, 'id'> => ({
                                label: criterion.label,
                                maxPoints: criterion.maxPoints,
                                weight: criterion.weight,
                                commentEnabled: criterion.commentEnabled,
                            })
                        ),
                    }
                    const newGrid = await createGrid(newGridData)
                    if (newGrid) {
                        toast.success('Grid created successfully!')
                        if (onSave) {
                            onSave(newGrid)
                        }
                    }
                }
            } catch (error) {
                toast.error('An error occurred while saving the grid.')
                console.log(error)
            }
        }, [
            grid,
            formData,
            saving,
            projectId,
            onSave,
            createGrid,
            updateGrid,
            addCriterion,
            removeCriterion,
            updateCriterion,
        ])

        const handleAddCriterion = useCallback(() => {
            if (newCriterion.label.trim()) {
                const newCriterionWithId = {
                    ...newCriterion,
                    id: `temp-${Date.now()}-${Math.random()}`,
                }
                setFormData((prev) => ({
                    ...prev,
                    criteria: [...prev.criteria, newCriterionWithId],
                }))
                setNewCriterion({
                    label: '',
                    maxPoints: 20,
                    weight: 1,
                    commentEnabled: false,
                })
            }
        }, [newCriterion, setFormData])

        const handleUpdateCriterion = useCallback(
            (
                criterionId: string,
                field: keyof GradingCriterion,
                value: string | number | boolean
            ) => {
                setFormData((prev) => {
                    const criteria = prev.criteria.map((criterion) =>
                        criterion.id === criterionId
                            ? { ...criterion, [field]: value }
                            : criterion
                    )
                    return { ...prev, criteria }
                })
            },
            [setFormData]
        )

        const handleRemoveCriterion = useCallback(
            (criterionId: string) => {
                setFormData((prev) => ({
                    ...prev,
                    criteria: prev.criteria.filter(
                        (criterion) => criterion.id !== criterionId
                    ),
                }))
            },
            [setFormData]
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
            <div className="space-y-6 max-w-4xl mx-auto">
                {error && (
                    <ErrorDisplay
                        error={error}
                        onRetry={() => window.location.reload()}
                        onDismiss={clearError}
                    />
                )}
                <Card className="w-full">
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
                                        <SelectItem value="group">
                                            Group
                                        </SelectItem>
                                        <SelectItem value="individual">
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
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="targetId">
                                        {formData.notationMode === 'group'
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
                                                            'group'
                                                          ? 'Select a group'
                                                          : 'Select a student'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.notationMode === 'group'
                                                ? groups.map((group) => (
                                                      <SelectItem
                                                          key={group.id}
                                                          value={group.id}
                                                      >
                                                          {group.name}
                                                      </SelectItem>
                                                  ))
                                                : students &&
                                                  students.map((student) => (
                                                      <SelectItem
                                                          key={student.user_id}
                                                          value={
                                                              student.user_id
                                                          }
                                                      >
                                                          {`${student.first_name} ${student.last_name} (${student.email})`}
                                                      </SelectItem>
                                                  ))}
                                        </SelectContent>
                                    </Select>
                                    {!readOnly &&
                                        formData.notationMode === 'group' && (
                                            <div className="space-y-2 mt-2">
                                                <Label>
                                                    Appliquer à tous les groupes
                                                </Label>
                                                <Switch
                                                    checked={applyToAllGroups}
                                                    onCheckedChange={
                                                        setApplyToAllGroups
                                                    }
                                                />
                                            </div>
                                        )}
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
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Grading Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="hidden lg:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">
                                                Label
                                            </TableHead>
                                            <TableHead className="w-[15%]">
                                                Max Points
                                            </TableHead>
                                            <TableHead className="w-[15%]">
                                                Weight
                                            </TableHead>
                                            <TableHead className="w-[15%]">
                                                Comment
                                            </TableHead>
                                            {!readOnly &&
                                                !grid?.isValidated && (
                                                    <TableHead className="w-[100px]">
                                                        Actions
                                                    </TableHead>
                                                )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.criteria.map(
                                            (
                                                criterion: GradingCriterion,
                                                idx: number
                                            ) => (
                                                <TableRow
                                                    key={
                                                        criterion.id ||
                                                        `new-${idx}`
                                                    }
                                                >
                                                    <TableCell>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            <div>
                                                                <div className="font-semibold break-words whitespace-normal">
                                                                    {
                                                                        criterion.label
                                                                    }
                                                                </div>
                                                                {criterion.comment && (
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {
                                                                            criterion.comment
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                value={
                                                                    criterion.label
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'label',
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Criterion label"
                                                                className="w-full"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            <div>
                                                                <div>{`${criterion.score ?? 0} / ${criterion.maxPoints}`}</div>
                                                                <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                                                                    <div
                                                                        className="bg-primary h-2.5 rounded-full"
                                                                        style={{
                                                                            width: `${((criterion.score ? Number(criterion.score) : 0) / Number(criterion.maxPoints)) * 100}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    criterion.maxPoints
                                                                }
                                                                min={1}
                                                                onChange={(e) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'maxPoints',
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Points"
                                                                className="w-full"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            criterion.weight
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    criterion.weight
                                                                }
                                                                min={1}
                                                                onChange={(e) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'weight',
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Weight"
                                                                className="w-full"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            criterion.commentEnabled ? (
                                                                'Yes'
                                                            ) : (
                                                                'No'
                                                            )
                                                        ) : (
                                                            <Switch
                                                                checked={
                                                                    criterion.commentEnabled
                                                                }
                                                                onCheckedChange={(
                                                                    checked
                                                                ) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'commentEnabled',
                                                                        checked
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </TableCell>
                                                    {!readOnly &&
                                                        !grid?.isValidated && (
                                                            <TableCell>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleRemoveCriterion(
                                                                            criterion.id ||
                                                                                `new-${idx}`
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="lg:hidden space-y-4">
                                {formData.criteria.map(
                                    (
                                        criterion: GradingCriterion,
                                        idx: number
                                    ) => (
                                        <Card
                                            key={criterion.id || `new-${idx}`}
                                            className="p-4"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">
                                                        Label
                                                    </Label>
                                                    {!readOnly &&
                                                        !grid?.isValidated && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                </div>
                                                {readOnly ||
                                                grid?.isValidated ? (
                                                    <div>
                                                        <div className="break-words whitespace-normal p-2 bg-muted rounded">
                                                            {criterion.label}
                                                        </div>
                                                        {criterion.comment && (
                                                            <div className="text-xs text-gray-500 italic mt-1 pl-2">
                                                                {
                                                                    criterion.comment
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Input
                                                        value={criterion.label}
                                                        onChange={(e) =>
                                                            handleUpdateCriterion(
                                                                criterion.id ||
                                                                    `new-${idx}`,
                                                                'label',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Criterion label"
                                                    />
                                                )}
                                                {(readOnly ||
                                                    grid?.isValidated) && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium">
                                                                Score:{' '}
                                                                {(() => {
                                                                    const result =
                                                                        grid?.results.find(
                                                                            (
                                                                                r
                                                                            ) =>
                                                                                r.gradingCriterionId ===
                                                                                criterion.id
                                                                        )
                                                                    return (
                                                                        result?.score ??
                                                                        0
                                                                    )
                                                                })()}{' '}
                                                                /{' '}
                                                                {
                                                                    criterion.maxPoints
                                                                }
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                ((() => {
                                                                    const result =
                                                                        grid?.results.find(
                                                                            (
                                                                                r
                                                                            ) =>
                                                                                r.gradingCriterionId ===
                                                                                criterion.id
                                                                        )
                                                                    return (
                                                                        result?.score ??
                                                                        0
                                                                    )
                                                                })() /
                                                                    Number(
                                                                        criterion.maxPoints
                                                                    )) *
                                                                100
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-3 gap-3 mt-3">
                                                    <div>
                                                        <Label className="text-sm">
                                                            Max Points
                                                        </Label>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            <div className="p-2 bg-muted rounded text-center">
                                                                {
                                                                    criterion.maxPoints
                                                                }
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    criterion.maxPoints
                                                                }
                                                                min={1}
                                                                onChange={(e) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'maxPoints',
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Points"
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">
                                                            Weight
                                                        </Label>
                                                        {readOnly ||
                                                        grid?.isValidated ? (
                                                            <div className="p-2 bg-muted rounded text-center">
                                                                {
                                                                    criterion.weight
                                                                }
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    criterion.weight
                                                                }
                                                                min={1}
                                                                onChange={(e) =>
                                                                    handleUpdateCriterion(
                                                                        criterion.id ||
                                                                            `new-${idx}`,
                                                                        'weight',
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                placeholder="Weight"
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">
                                                            Comment
                                                        </Label>
                                                        <div className="flex items-center justify-center h-10">
                                                            {readOnly ||
                                                            grid?.isValidated ? (
                                                                <span className="text-sm">
                                                                    {criterion.commentEnabled
                                                                        ? 'Yes'
                                                                        : 'No'}
                                                                </span>
                                                            ) : (
                                                                <Switch
                                                                    checked={
                                                                        criterion.commentEnabled
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked
                                                                    ) =>
                                                                        handleUpdateCriterion(
                                                                            criterion.id ||
                                                                                `new-${idx}`,
                                                                            'commentEnabled',
                                                                            checked
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                )}
                            </div>
                        </div>
                        {!readOnly && !grid?.isValidated && (
                            <div className="pt-4 mt-4 border-t">
                                <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-4 w-full">
                                    <div>
                                        <Label htmlFor="new-criterion-label">
                                            Label
                                        </Label>
                                        <Input
                                            id="new-criterion-label"
                                            placeholder="New criterion label"
                                            value={newCriterion.label}
                                            onChange={(e) =>
                                                setNewCriterion((prev) => ({
                                                    ...prev,
                                                    label: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-criterion-maxpoints">
                                            Points
                                        </Label>
                                        <Input
                                            id="new-criterion-maxpoints"
                                            type="number"
                                            className="w-24"
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
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-criterion-weight">
                                            Weight
                                        </Label>
                                        <Input
                                            id="new-criterion-weight"
                                            type="number"
                                            className="w-24"
                                            value={newCriterion.weight}
                                            min={1}
                                            onChange={(e) =>
                                                setNewCriterion((prev) => ({
                                                    ...prev,
                                                    weight: Number(
                                                        e.target.value
                                                    ),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Label>Comment</Label>
                                        <Switch
                                            checked={
                                                newCriterion.commentEnabled
                                            }
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
                                <div className="lg:hidden space-y-4">
                                    <h4 className="font-medium">
                                        Add New Criterion
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="new-criterion-label-mobile">
                                                Label
                                            </Label>
                                            <Input
                                                id="new-criterion-label-mobile"
                                                placeholder="New criterion label"
                                                value={newCriterion.label}
                                                onChange={(e) =>
                                                    setNewCriterion((prev) => ({
                                                        ...prev,
                                                        label: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="new-criterion-maxpoints-mobile">
                                                    Points
                                                </Label>
                                                <Input
                                                    id="new-criterion-maxpoints-mobile"
                                                    type="number"
                                                    value={
                                                        newCriterion.maxPoints
                                                    }
                                                    min={1}
                                                    onChange={(e) =>
                                                        setNewCriterion(
                                                            (prev) => ({
                                                                ...prev,
                                                                maxPoints:
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="new-criterion-weight-mobile">
                                                    Weight
                                                </Label>
                                                <Input
                                                    id="new-criterion-weight-mobile"
                                                    type="number"
                                                    value={newCriterion.weight}
                                                    min={1}
                                                    onChange={(e) =>
                                                        setNewCriterion(
                                                            (prev) => ({
                                                                ...prev,
                                                                weight: Number(
                                                                    e.target
                                                                        .value
                                                                ),
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Comment</Label>
                                                <div className="flex items-center justify-center h-10">
                                                    <Switch
                                                        checked={
                                                            newCriterion.commentEnabled
                                                        }
                                                        onCheckedChange={(
                                                            checked
                                                        ) =>
                                                            setNewCriterion(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    commentEnabled:
                                                                        checked,
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleAddCriterion}
                                            variant="outline"
                                            className="w-full flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Criterion
                                        </Button>
                                    </div>
                                </div>
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
