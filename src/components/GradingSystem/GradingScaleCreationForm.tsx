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
    GradingGridType,
    NotationMode,
    GradingGrid,
    GradingCriterion,
} from '@/components/GradingSystem/type'
import { toast } from 'sonner'

interface GradingScaleCreationFormProps {
    projectId: string
    defaultType: string
    defaultTargetId?: string
    onCancel: () => void
    onSuccess?: (gradingGrid: GradingGrid) => void
}

interface CriterionForm {
    label: string
    maxPoints: number
    weight?: number
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
    const [type, setType] = useState<GradingGridType>(
        defaultType.toLowerCase() === 'deliverable'
            ? 'livrable'
            : defaultType.toLowerCase() === 'report'
              ? 'rapport'
              : defaultType.toLowerCase() === 'oralpresentation'
                ? 'soutenance'
                : 'livrable'
    )
    const [notationMode, setNotationMode] = useState<NotationMode>('groupe')
    const [criteria, setCriteria] = useState<CriterionForm[]>([
        { label: '', maxPoints: 20, weight: 1, commentEnabled: true },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [existingScale, setExistingScale] = useState<GradingGrid | null>(null)

    useEffect(() => {
        // Check if grading scale already exists for this target
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
                        setType(scale.type)
                        setNotationMode(scale.notationMode)
                        setDescription(scale.generalComment || '')
                        if (scale.criteria && scale.criteria.length > 0) {
                            setCriteria(
                                scale.criteria.map((c) => ({
                                    label: c.label,
                                    maxPoints: c.maxPoints,
                                    weight: c.weight || 1,
                                    commentEnabled: c.commentEnabled,
                                }))
                            )
                        }
                    }
                } catch (error) {
                    console.error('Error checking existing scale:', error)
                }
            }
        }
        checkExistingScale()
    }, [defaultTargetId])

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
            const dto: CreateGradingGridDto = {
                projectId,
                type,
                targetId: defaultTargetId,
                notationMode,
                title: title.trim(),
                criteria: validCriteria.map((c) => ({
                    label: c.label.trim(),
                    maxPoints: c.maxPoints,
                    weight: c.weight || 1,
                    commentEnabled: c.commentEnabled,
                })),
                generalComment: description.trim() || undefined,
            }

            const response = await gradingService.createGrid(projectId, dto)
            if (response.success && response.data) {
                toast.success('Grading scale created successfully')
                onSuccess?.(response.data as GradingGrid)
                onCancel()
            } else {
                throw new Error(
                    response.error || 'Failed to create grading scale'
                )
            }
        } catch (error) {
            console.error('Error creating grading scale:', error)
            toast.error('Failed to create grading scale')
        } finally {
            setIsLoading(false)
        }
    }

    const getTypeDisplayName = (type: GradingGridType) => {
        switch (type) {
            case 'livrable':
                return 'Deliverable'
            case 'rapport':
                return 'Report'
            case 'soutenance':
                return 'Oral Presentation'
            default:
                return type
        }
    }

    if (existingScale && existingScale.isValidated) {
        return (
            <Card>
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
                                <div className="space-y-2">
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
        <Card>
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
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter grading scale title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notationMode">Notation Mode</Label>
                            <Select
                                value={notationMode}
                                onValueChange={(value) =>
                                    setNotationMode(value as NotationMode)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="groupe">
                                        Group
                                    </SelectItem>
                                    <SelectItem value="individuel">
                                        Individual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter a description for this grading scale (optional)"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">Grading Criteria</h4>
                            <Button
                                type="button"
                                onClick={addCriterion}
                                size="sm"
                                variant="outline"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Criterion
                            </Button>
                        </div>

                        {criteria.map((criterion, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 space-y-4"
                            >
                                <div className="flex justify-between items-center">
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
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
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
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Points</Label>
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
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <Switch
                                            checked={criterion.commentEnabled}
                                            onCheckedChange={(checked) =>
                                                updateCriterion(
                                                    index,
                                                    'commentEnabled',
                                                    checked
                                                )
                                            }
                                        />
                                        <Label>Enable Comments</Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading}>
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
