import { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { DraggableStudent } from '@/components/AddStudentToStudentBatch/DraggableStudent'
import { DroppableZone } from '@/components/AddStudentToStudentBatch/DroppableZone'
import { useParams } from 'react-router'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { Project } from '@/components/ManageProjects/types.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import { groupService } from '@/services/ProjectService/project-api-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { LogOutIcon } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { DateTime } from 'luxon'

type ProjectGroupsCompositionProps = {
    currentProject: Project
}

export default function ProjectGroupsComposition({
    currentProject,
}: ProjectGroupsCompositionProps) {
    const { projectId } = useParams()
    const [batchStudents, setBatchStudents] = useState<Student[]>([])
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [groups, setGroups] = useState<ProjectGroup[]>([])

    // Students not assigned to any group
    const availableStudents = batchStudents.filter(
        (student) =>
            !groups.some((group) =>
                (group.studentsIds ?? '')
                    .split(',')
                    .map((id: string) => id.trim())
                    .includes(student.user_id)
            )
    )

    // Handle drag drop student movement
    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e
        if (!active?.id || !over?.id) return
        const studentId = active.id as string
        const targetGroupId = over.id

        //Students
        if (
            currentUser?.role === 'STUDENT' &&
            currentProject.creationGroupDeadLineDate
        ) {
            const deadLineDate = DateTime.fromISO(
                currentProject.creationGroupDeadLineDate
            )
            console.log(deadLineDate.toFormat('dd/MM'))
            if (deadLineDate < DateTime.now()) {
                toast.warning(
                    "Students can't make groups anymore, deadline passed. The teacher will fill in the groups randomly."
                )
                return
            }
        }

        setGroups((prevGroups) =>
            prevGroups.map((group) => {
                const ids = (group.studentsIds ?? '').split(',').filter(Boolean)

                const newIds =
                    group.id === targetGroupId
                        ? Array.from(new Set([...ids, studentId]))
                        : ids.filter((id: string) => id !== studentId)

                if (newIds.length > currentProject.maxPerGroup) {
                    toast.warning(
                        `Group is limited to ${currentProject.maxPerGroup} students.`
                    )
                    return group
                }

                return {
                    ...group,
                    studentsIds: newIds.join(','),
                }
            })
        )
    }

    // Load batch students
    const loadBatchStudents = async () => {
        try {
            if (!currentProject.studentBatch) {
                toast.warning('No student batch assigned to this project')
                return
            }
            const response = await authService.getStudents()
            if (response.success) {
                const all = response.data as Student[]
                const batchIds =
                    typeof currentProject.studentBatch.students === 'string'
                        ? currentProject.studentBatch.students
                              .split(',')
                              .map((id: string) => id.trim())
                        : []

                const filtered = all.filter((s) => batchIds.includes(s.user_id))
                setBatchStudents(filtered)
            } else {
                toast.error(response.error)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to load students.')
        }
    }

    // Load project groups
    const loadGroups = async () => {
        try {
            const response = await groupService.getAll(projectId || '')
            if (response.success) {
                setGroups(response.data as ProjectGroup[])
            } else {
                toast.error(response.error)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to load groups.')
        }
    }

    const handleUpdateGroups = async () => {
        let allGood = true
        for (const group of groups) {
            try {
                console.log('## GROUPS data')
                console.log(group.id)
                console.log(group.studentsIds)
                const response = await groupService.update(group.id, {
                    studentsIds: group.studentsIds,
                })
                allGood = response.success
            } catch (err) {
                allGood = false
                console.error(err)
                toast.error(`Failed to update group ${group.name}`)
            }
        }

        if (allGood) toast.success('Update groups successfully')
    }

    useEffect(() => {
        loadBatchStudents()
        loadGroups()
    }, [])

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            {currentUser?.role === 'TEACHER' ? (
                <h2 className="mt-4 text-xl">
                    Drag and drop the students to move them to a group
                </h2>
            ) : (
                <h2 className="mt-4">Drag and drop yourself to a group</h2>
            )}

            <div className="grid grid-cols-[1fr_4fr] gap-8 p-6 items-start">
                {/* Available Students */}
                <div className="h-full w-full self-stretch col-span-1 bg-white dark:bg-muted border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Available Students ({availableStudents.length})
                    </h2>
                    <DroppableZone id="available">
                        <div className="overflow-y-auto space-y-2 max-h-[60vh] w-full">
                            {availableStudents.map((s) => (
                                <DraggableStudent
                                    key={s.user_id}
                                    student={s}
                                    canDrag={
                                        currentUser?.role !== 'STUDENT' ||
                                        currentUser.user_id === s.user_id
                                    }
                                />
                            ))}
                        </div>
                    </DroppableZone>
                </div>

                {/* Group Containers */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.length > 0 ? (
                        groups.map((g) => {
                            const assigned = batchStudents.filter((s) =>
                                (g.studentsIds ?? '')
                                    .split(',')
                                    .map((id: string) => id.trim())
                                    .includes(s.user_id)
                            )

                            return (
                                <div
                                    key={g.id}
                                    className="border rounded-lg p-4 bg-muted/10"
                                >
                                    <h3 className="font-semibold mb-2">
                                        {g.name}
                                    </h3>
                                    <DroppableZone id={g.id}>
                                        {assigned.map((s) => (
                                            <div
                                                key={s.user_id}
                                                className="flex mb-1 w-full"
                                            >
                                                <DraggableStudent
                                                    key={s.user_id}
                                                    student={s}
                                                    canDrag={
                                                        currentUser?.role !==
                                                            'STUDENT' ||
                                                        currentUser.user_id ===
                                                            s.user_id
                                                    }
                                                />
                                                {currentUser?.role !==
                                                    'STUDENT' ||
                                                    (currentUser.user_id ===
                                                        s.user_id && (
                                                        <button
                                                            className="text-primary hover:text-primary-foreground cursor-pointer"
                                                            onClick={() => {
                                                                const updated =
                                                                    (
                                                                        g.studentsIds ??
                                                                        ''
                                                                    )
                                                                        .split(
                                                                            ','
                                                                        )
                                                                        .filter(
                                                                            (
                                                                                id: string
                                                                            ) =>
                                                                                id.trim() !==
                                                                                s.user_id
                                                                        )
                                                                        .join(
                                                                            ','
                                                                        )
                                                                setGroups(
                                                                    (prev) =>
                                                                        prev.map(
                                                                            (
                                                                                grp
                                                                            ) =>
                                                                                grp.id ===
                                                                                g.id
                                                                                    ? {
                                                                                          ...grp,
                                                                                          studentsIds:
                                                                                              updated,
                                                                                      }
                                                                                    : grp
                                                                        )
                                                                )
                                                            }}
                                                        >
                                                            <LogOutIcon />
                                                        </button>
                                                    ))}
                                            </div>
                                        ))}
                                    </DroppableZone>
                                </div>
                            )
                        })
                    ) : (
                        <p>
                            Finish and save your settings first. The groups
                            container will appear after that.
                        </p>
                    )}
                </div>
            </div>

            <Button onClick={() => handleUpdateGroups()} className="self-start">
                Save group changes
            </Button>
        </DndContext>
    )
}
