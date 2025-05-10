import { useDroppable } from '@dnd-kit/core'
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
            className={`min-h-[24vh] p-4 border-1 rounded ${
                isOver
                    ? 'border-primary bg-muted-foregroung'
                    : 'border-foreground'
            }`}
        >
            {children}
        </div>
    )
}
