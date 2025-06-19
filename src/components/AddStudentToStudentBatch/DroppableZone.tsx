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
            className={`min-h-[24vh] p-4 rounded ${
                isOver
                    ? 'border border-primary'
                    : ''
            }`}
        >
            {children}
        </div>
    )
}
