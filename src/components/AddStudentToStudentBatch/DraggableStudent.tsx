import { useDraggable } from '@dnd-kit/core'
import { Student } from '@/components/ManageStudentBatches/types.ts'

export const DraggableStudent = ({ student }: { student: Student }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.id,
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="p-2 m-2 bg-white dark:bg-sidebar-accent border rounded shadow cursor-move flex items-center gap-2"
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
            }}
        >
            <span>{student.first_name + ' ' + student.last_name}</span>
        </div>
    )
}
