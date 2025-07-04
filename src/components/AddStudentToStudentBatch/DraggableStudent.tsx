import { useDraggable } from '@dnd-kit/core'
import { Student } from '@/components/ManageStudentBatches/types'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

export const DraggableStudent = ({
    student,
    canDrag = true,
}: {
    student: Student
    canDrag?: boolean
}) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: student.user_id,
        disabled: !canDrag,
    })
    const { currentUser } = useSelector((state: RootState) => state.user)
    const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${student.user_id}`

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="p-2 m-2 bg-white dark:bg-sidebar-accent border rounded shadow cursor-move flex items-center gap-2 relative w-full"
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : undefined,
            }}
        >
            {currentUser?.user_id === student.user_id && (
                <span className="ml-2 text-xs font-semibold bg-ring px-2 py-0.5 rounded-full absolute top-1 right-1 z-10">
                    You
                </span>
            )}
            <img
                src={avatarUrl}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
            />
            <span className="">
                {student.first_name + ' ' + student.last_name}
            </span>
        </div>
    )
}
