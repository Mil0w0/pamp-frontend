import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { gradingService } from '@/services/GradingService/grading-api-client'
import {
    CreateGradingGridDto,
    UpdateGradingGridDto,
    GradingGridType,
    NotationMode,
    GradingGrid,
    GradingCriterion,
} from '@/types/grading'
import { toast } from 'sonner'

interface GradingScaleCreationFormProps {
    projectId: string
    defaultType: string
    defaultTargetId?: string
    onCancel: () => void
    onSuccess?: (gradingGrid: GradingGrid) => void
}

interface CriterionForm {
    id?: string
    label: string
    maxPoints: number
    weight: number
    commentEnabled: boolean
}

export function GradingScaleCreationForm({
    projectId,
    defaultType,
    defaultTargetId,
    onCancel,
    onSuccess,
}: GradingScaleCreationFormProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const typeMap: Record<string, GradingGridType> = {
        deliverable: 'deliverable',
        report: 'report',
        oralpresentation: 'presentation',
        presentation: 'presentation',
        livrable: 'deliverable',
        rapport: 'report',
        soutenance: 'presentation',
    }
    const modeMap: Record<string, NotationMode> = {
        groupe: 'group',
        group: 'group',
        individuel: 'individual',
        individual: 'individual',
    }
    const [type, setType] = useState<GradingGridType>(
        typeMap[defaultType.toLowerCase()] || 'deliverable'
    )
    const [notationMode, setNotationMode] = useState<NotationMode>('group')
    const [criteria, setCriteria] = useState<CriterionForm[]>([
        { label: '', maxPoints: 20, weight: 1, commentEnabled: true },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [existingScale, setExistingScale] = useState<GradingGrid | null>(null)

    useEffect(() => {
        const checkExistingScale = async () => {
            if (defaultTargetId) {
                try {
                    const response = await gradingService.getGridByTarget(
                        projectId,
                        type,
                        defaultTargetId
                    )
                    if (response.success && response.data) {
                        const scale = response.data as GradingGrid
                        setExistingScale(scale)
                        setTitle(scale.title)
                        setType(typeMap[scale.type] || scale.type)
                        setNotationMode(
                            modeMap[scale.notationMode] || scale.notationMode
                        )
                        setDescription(scale.generalComment || '')
                        if (scale.criteria && scale.criteria.length > 0) {
                            setCriteria(
                                scale.criteria.map((c) => ({
                                    id: c.id,
                                    label: c.label ?? '',
                                    maxPoints: c.maxPoints ?? 20,
                                    weight: c.weight ?? 1,
                                    commentEnabled: c.commentEnabled ?? true,
                                }))
                            )
                        }
                    }
                } catch (error) {
                    console.log(error)
                }
            }
        }
        checkExistingScale()
    }, [defaultTargetId, projectId, type])

    const addCriterion = () => {
        setCriteria([
            ...criteria,
            { label: '', maxPoints: 20, weight: 1, commentEnabled: true },
        ])
    }

    const removeCriterion = (index: number) => {
        if (criteria.length > 1) {
            setCriteria(criteria.filter((_, i) => i !== index))
        }
    }

    const updateCriterion = (
        index: number,
        field: keyof CriterionForm,
        value: string | number | boolean
    ) => {
        const updated = [...criteria]
        updated[index] = { ...updated[index], [field]: value }
        setCriteria(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error('Please enter a title for the grading scale')
            return
        }
        if (!defaultTargetId) {
            toast.error('Target ID is required')
            return
        }
        const validCriteria = criteria.filter((c) => c.label.trim() !== '')
        if (validCriteria.length === 0) {
            toast.error('Please add at least one criterion')
            return
        }
        if (validCriteria.some((c) => c.maxPoints <= 0)) {
            toast.error('Max points must be positive for all criteria')
            return
        }
        setIsLoading(true)
        try {
            if (existingScale) {
                const updateDto: UpdateGradingGridDto = {
                    title: title.trim(),
                    notationMode: notationMode,
                    criteria: validCriteria.map((c) => {
                        const criterionData = {
                            label: c.label.trim(),
                            maxPoints: c.maxPoints,
                            weight: c.weight ?? 1,
                            commentEnabled: c.commentEnabled,
                        }
                        if (c.id) {
                            ;(criterionData as GradingCriterion).id = c.id
                        }
                        return criterionData
                    }),
                }
                const response = await gradingService.updateGrid(
                    existingScale.id,
                    updateDto
                )
                if (response.success && response.data) {
                    toast.success('Grading scale updated successfully')
                    onSuccess?.(response.data as GradingGrid)
                    onCancel()
                } else {
                    throw new Error(
                        response.error || 'Failed to update grading scale'
                    )
                }
            } else {
                const createDto: CreateGradingGridDto = {
                    projectId,
                    type: type,
                    targetId: defaultTargetId,
                    notationMode: notationMode,
                    title: title.trim(),
                    criteria: validCriteria.map((c) => ({
                        label: c.label.trim(),
                        maxPoints: c.maxPoints,
                        weight: c.weight || 1,
                        commentEnabled: c.commentEnabled,
                    })),
                    generalComment: description.trim() || undefined,
                }
                const response = await gradingService.createGrid(
                    projectId,
                    createDto
                )
                if (response.success && response.data) {
                    toast.success('Grading scale created successfully')
                    onSuccess?.(response.data as GradingGrid)
                    onCancel()
                } else {
                    throw new Error(
                        response.error || 'Failed to create grading scale'
                    )
                }
            }
        } catch (error) {
            toast.error('Failed to handle grading scale')
            console.log(error)
        } finally {
            setIsLoading(false)
        }
    }

    const getTypeDisplayName = (type: GradingGridType) => {
        const displayMap: Record<GradingGridType, string> = {
            livrable: 'Deliverable',
            deliverable: 'Deliverable',
            rapport: 'Report',
            report: 'Report',
            soutenance: 'Oral Presentation',
            presentation: 'Oral Presentation',
        }
        return displayMap[type] || type
    }

    if (existingScale && existingScale.isValidated) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Grading Scale - {existingScale.title}</CardTitle>
                    <CardDescription>
                        This grading scale is validated and cannot be modified.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Badge variant="secondary">
                                {getTypeDisplayName(existingScale.type)}
                            </Badge>
                            <Badge variant="outline">
                                {existingScale.notationMode}
                            </Badge>
                            <Badge variant="default">Validated</Badge>
                        </div>
                        {existingScale.criteria &&
                            existingScale.criteria.length > 0 && (
                                <div className="space-y-2 w-full">
                                    <h4 className="font-medium">Criteria:</h4>
                                    {existingScale.criteria.map(
                                        (
                                            criterion: GradingCriterion,
                                            index: number
                                        ) => (
                                            <div
                                                key={index}
                                                className="flex justify-between items-center p-2 border rounded"
                                            >
                                                <span>{criterion.label}</span>
                                                <div className="flex gap-2 text-sm text-muted-foreground">
                                                    <span>
                                                        Max:{' '}
                                                        {criterion.maxPoints}
                                                    </span>
                                                    {criterion.weight && (
                                                        <span>
                                                            Weight:{' '}
                                                            {criterion.weight}
                                                        </span>
                                                    )}
                                                    {criterion.commentEnabled && (
                                                        <span>
                                                            Comments enabled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        <Button onClick={onCancel} variant="outline">
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-full">
            <CardHeader>
                <CardTitle>
                    {existingScale
                        ? 'Edit Grading Scale'
                        : 'Create Grading Scale'}
                </CardTitle>
                <CardDescription>
                    Define the grading criteria for this{' '}
                    {getTypeDisplayName(type).toLowerCase()}
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full max-w-full">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 w-full min-w-[500px] overflow-x-auto"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                        <div className="space-y-2 w-full">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter grading scale title"
                                required
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2 w-full">
                            <Label htmlFor="notationMode">Notation Mode</Label>
                            <Select
                                value={notationMode}
                                onValueChange={(value) =>
                                    setNotationMode(value as NotationMode)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="group">Group</SelectItem>
                                    <SelectItem value="individual">
                                        Individual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2 w-full">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter a description for this grading scale (optional)"
                            rows={3}
                            className="w-full resize-none"
                        />
                    </div>
                    <div className="space-y-4 w-full min-w-[600px] overflow-x-auto">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <h4 className="font-medium">Grading Criteria</h4>
                            <Button
                                type="button"
                                onClick={addCriterion}
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Criterion
                            </Button>
                        </div>
                        <div className="space-y-4 w-full">
                            <div className="hidden sm:grid sm:grid-cols-[minmax(200px,4fr)_minmax(70px,1fr)_minmax(50px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)] gap-4 items-center w-full font-medium text-muted-foreground px-2 pb-1">
                                <div>Label</div>
                                <div>Points</div>
                                <div>Weight</div>
                                <div>Comment</div>
                                <div>Actions</div>
                            </div>
                            {criteria.map((criterion, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-4 space-y-4 w-full"
                                >
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <h5 className="font-medium">
                                            Criterion {index + 1}
                                        </h5>
                                        {criteria.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    removeCriterion(index)
                                                }
                                                size="sm"
                                                variant="ghost"
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex flex-col space-y-4 sm:grid sm:grid-cols-[minmax(200px,4fr)_minmax(70px,1fr)_minmax(50px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)] sm:gap-4 items-start sm:items-center w-full">
                                        <div className="space-y-2 w-full">
                                            <Label>Label</Label>
                                            <Input
                                                value={criterion.label}
                                                onChange={(e) =>
                                                    updateCriterion(
                                                        index,
                                                        'label',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Criterion name"
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Points</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={criterion.maxPoints}
                                                onChange={(e) => {
                                                    const val = parseInt(
                                                        e.target.value
                                                    )
                                                    updateCriterion(
                                                        index,
                                                        'maxPoints',
                                                        isNaN(val)
                                                            ? 20
                                                            : Math.max(1, val)
                                                    )
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Weight</Label>
                                            <Input
                                                type="number"
                                                min="0.1"
                                                max="10"
                                                step="0.1"
                                                value={criterion.weight || 1}
                                                onChange={(e) =>
                                                    updateCriterion(
                                                        index,
                                                        'weight',
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2 lg:pt-6 w-full">
                                            <Switch
                                                checked={
                                                    criterion.commentEnabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    updateCriterion(
                                                        index,
                                                        'commentEnabled',
                                                        checked
                                                    )
                                                }
                                            />
                                            <Label className="whitespace-nowrap">
                                                Comment
                                            </Label>
                                        </div>
                                        <div className="flex items-center pt-2 lg:pt-6 w-full justify-end">
                                            {criteria.length > 1 && (
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        removeCriterion(index)
                                                    }
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                onClick={addCriterion}
                                                size="sm"
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                + Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            {isLoading
                                ? 'Creating...'
                                : existingScale
                                  ? 'Update'
                                  : 'Create'}{' '}
                            Grading Scale
                        </Button>
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default GradingScaleCreationForm
