import { useDraggable } from '@dnd-kit/core'
import { Student } from '@/components/ManageStudentBatches/types'

export const DraggableStudent = ({ student }: { student: Student }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.user_id,
    })

    const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${student.user_id}`

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="p-2 m-2 bg-white dark:bg-sidebar-accent border rounded shadow cursor-move flex items-center gap-2 w-full"
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
            }}
        >
            <img
                src={avatarUrl}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
            />
            <span>{student.first_name + ' ' + student.last_name}</span>
        </div>
    )
}
