import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { DroppableZone } from '@/components/AddStudentToStudentBatch/DroppableZone.tsx'
import { DraggableStudent } from '@/components/AddStudentToStudentBatch/DraggableStudent.tsx'
import { Button } from '@/components/ui/button.tsx'
import AddStudentModal from '@/components/AddStudentToStudentBatch/AddStudentModal.tsx'

const initialStudents = [
    {
        user_id: '1',
        first_name: 'Lara',
        last_name: 'CROFT',
        email: 'lara@gmail.com',
    },
    {
        user_id: '2',
        first_name: 'Max',
        last_name: 'CHARLES',
        email: 'nino@gmail.com',
    },
    {
        user_id: '3',
        first_name: 'Lara',
        last_name: 'CROFT',
        email: 'lara@gmail.com',
    },
    {
        user_id: '42',
        first_name: 'Max',
        last_name: 'CHARLES',
        email: 'nino@gmail.com',
    },
    {
        user_id: '492',
        first_name: 'Max',
        last_name: 'CHARLES',
        email: 'nino@gmail.com',
    },
    {
        user_id: '20',
        first_name: 'Max',
        last_name: 'CHARLES',
        email: 'nino@gmail.com',
    },
    {
        user_id: '219',
        first_name: 'Max',
        last_name: 'CHARLES',
        email: 'nino@gmail.com',
    },
]
export type StudentBatchDroppableContainersProps = {
    selectedStudents: Student[]
    setSelectedStudents: (students: Student[]) => void
}

export default function StudentBatchDroppableContainers({
    selectedStudents,
    setSelectedStudents,
}: StudentBatchDroppableContainersProps) {
    const [allStudents, setAllStudents] = useState<Student[]>(initialStudents) //todo: getAllStudents from the DB or from the teacher Default promotion ?
    const selectedIds = selectedStudents.map((s) => s.user_id)
    const availableStudents = allStudents.filter(
        (s) => !selectedIds.includes(s.user_id)
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event
        if (over?.id === 'selected' && active?.id) {
            const draggedStudent = availableStudents.find(
                (s) => s.user_id === active.id
            )
            if (
                draggedStudent &&
                !selectedStudents.some((s) => s.user_id === active.id)
            ) {
                setSelectedStudents([...selectedStudents, draggedStudent])
            }
        }
    }

    const handleRemove = (id: string) => {
        setSelectedStudents(selectedStudents.filter((s) => s.user_id !== id))
    }

    const handleAddAll = () => {
        const toAdd = availableStudents.filter(
            (s) => !selectedStudents.find((ss) => ss.user_id === s.user_id)
        )
        setSelectedStudents(toAdd)
    }

    const handleFilterStudents = () => {}

    return (
        <div className="p-6 space-y-6">
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Container 1: Available students */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">
                            Available Students
                        </h2>
                        <DroppableZone id="available">
                            <div className="max-h-[26vh] overflow-y-auto">
                                {availableStudents.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No available students.
                                    </p>
                                ) : (
                                    availableStudents.map((student) => (
                                        <DraggableStudent
                                            key={student.user_id}
                                            student={student}
                                        />
                                    ))
                                )}
                            </div>
                        </DroppableZone>
                        <div className="flex-row flex mt-4 justify-between">
                            <Button variant="outline" onClick={handleAddAll}>
                                Add all
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleFilterStudents}
                            >
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Container 2: Selected Students */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">
                            Selected Students
                        </h2>
                        <DroppableZone id="selected">
                            <div className="max-h-[26vh] overflow-y-auto">
                                {selectedStudents.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Drag students here
                                    </p>
                                ) : (
                                    selectedStudents.map((student) => (
                                        <div
                                            key={student.user_id}
                                            className="p-2 m-2 bg-white dark:bg-sidebar-accent border rounded shadow cursor-move flex items-center gap-2"
                                        >
                                            <span>
                                                {student.first_name +
                                                    ' ' +
                                                    student.last_name}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleRemove(
                                                        student.user_id
                                                    )
                                                }
                                                style={{ cursor: 'pointer' }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DroppableZone>
                        <AddStudentModal
                            setSelectedStudents={setSelectedStudents}
                            selectedStudents={selectedStudents}
                        />
                    </div>
                </div>
            </DndContext>
        </div>
    )
}
