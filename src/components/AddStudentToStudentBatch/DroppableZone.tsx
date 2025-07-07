import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export const DroppableZone = ({
    id,
    children,
}: {
    id: string
    children: React.ReactNode
}) => {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-h-[100px] transition-all duration-200',
                isOver &&
                    'bg-primary/5 border-2 border-primary border-dashed rounded-lg'
            )}
        >
            {children}
        </div>
    )
}
