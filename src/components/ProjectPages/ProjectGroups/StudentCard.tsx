import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, X } from 'lucide-react'
import { Student } from '@/components/ManageStudentBatches/types'
import { useDraggable } from '@dnd-kit/core'

interface StudentCardProps {
    student: Student
    canDrag?: boolean
    isDragging?: boolean
    showRemoveButton?: boolean
    onRemove?: () => void
    className?: string
}

export function StudentCard({
    student,
    canDrag = true,
    isDragging = false,
    showRemoveButton = false,
    onRemove,
    className,
}: StudentCardProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.user_id,
        disabled: !canDrag,
    })

    return (
        <Card
            ref={setNodeRef}
            className={cn(
                'group relative transition-all duration-200 hover:shadow-sm border-2 hover:border-yellow-400',
                isDragging && 'opacity-50 shadow-lg rotate-2 border-yellow-400',
                !canDrag && 'opacity-60 cursor-not-allowed',
                className
            )}
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
            }}
        >
            <div className="flex items-center gap-3 p-3">
                {canDrag && (
                    <div
                        {...listeners}
                        {...attributes}
                        className="flex-shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                )}

                <div
                    {...(canDrag ? listeners : {})}
                    {...(canDrag ? attributes : {})}
                    className={cn(
                        'flex items-center gap-3 flex-1 min-w-0',
                        canDrag && 'cursor-grab active:cursor-grabbing'
                    )}
                >
                    <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${student.user_id}`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                                {student.first_name} {student.last_name}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {student.email}
                        </p>
                    </div>
                </div>

                {showRemoveButton && onRemove && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onRemove()
                        }}
                        aria-label="Remove student from group"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </Card>
    )
}
