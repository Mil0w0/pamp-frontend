import { useEffect, useState } from 'react'
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core'
import { useParams } from 'react-router'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { Project } from '@/components/ManageProjects/types.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import { groupService } from '@/services/ProjectService/project-api-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { DateTime } from 'luxon'
import { GroupCard } from './GroupCard'
import { StudentCard } from './StudentCard'
import { DroppableZone } from '@/components/AddStudentToStudentBatch/DroppableZone'
import { StatusIndicator } from './StatusIndicator'
import { AlertCircle, Clock, Save, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type ProjectGroupsCompositionProps = {
    currentProject: Project
    refreshTrigger?: number
}

export default function ProjectGroupsComposition({
    currentProject,
    refreshTrigger,
}: ProjectGroupsCompositionProps) {
    const { projectId } = useParams()
    const [batchStudents, setBatchStudents] = useState<Student[]>([])
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [groups, setGroups] = useState<ProjectGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeStudent, setActiveStudent] = useState<Student | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

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

    // Check if deadline has passed for students
    const isDeadlinePassed = () => {
        if (!currentProject.creationGroupDeadLineDate) return false
        return (
            DateTime.fromISO(currentProject.creationGroupDeadLineDate) <
            DateTime.now()
        )
    }

    const canStudentMakeChanges = () => {
        return currentUser?.role !== 'STUDENT' || !isDeadlinePassed()
    }

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const studentId = event.active.id as string
        const student = batchStudents.find((s) => s.user_id === studentId)
        setActiveStudent(student || null)
    }

    // Handle drag end - student movement
    const handleDragEnd = (e: DragEndEvent) => {
        setActiveStudent(null)

        const { active, over } = e
        if (!active?.id || !over?.id) return

        const studentId = active.id as string
        const targetId = over.id as string

        // Check permissions for students
        if (currentUser?.role === 'STUDENT' && !canStudentMakeChanges()) {
            toast.warning(
                "Students can't make groups anymore, deadline passed. The teacher will fill in the groups randomly."
            )
            return
        }

        // Only allow students to move themselves
        if (
            currentUser?.role === 'STUDENT' &&
            currentUser.user_id !== studentId
        ) {
            toast.warning('Students can only move themselves between groups.')
            return
        }

        // If dropping back to available zone, remove from all groups
        if (targetId === 'available') {
            setGroups((prevGroups) =>
                prevGroups.map((group) => {
                    const ids = (group.studentsIds ?? '')
                        .split(',')
                        .filter(Boolean)
                    const newIds = ids.filter((id: string) => id !== studentId)

                    return {
                        ...group,
                        studentsIds: newIds.join(','),
                    }
                })
            )
            setHasChanges(true)
            return
        }

        // Handle dropping to a group
        setGroups((prevGroups) => {
            const targetGroup = prevGroups.find((g) => g.id === targetId)
            if (!targetGroup) return prevGroups

            // Check group capacity first
            const targetGroupIds = (targetGroup.studentsIds ?? '')
                .split(',')
                .filter(Boolean)
            if (targetGroupIds.includes(studentId)) {
                // Student is already in this group, no change needed
                return prevGroups
            }

            if (targetGroupIds.length >= currentProject.maxPerGroup) {
                toast.warning(
                    `Group "${targetGroup.name}" is limited to ${currentProject.maxPerGroup} students.`
                )
                return prevGroups
            }

            return prevGroups.map((group) => {
                const ids = (group.studentsIds ?? '').split(',').filter(Boolean)

                const newIds =
                    group.id === targetId
                        ? Array.from(new Set([...ids, studentId]))
                        : ids.filter((id: string) => id !== studentId)

                return {
                    ...group,
                    studentsIds: newIds.join(','),
                }
            })
        })

        setHasChanges(true)
    }

    // Remove student from group
    const handleRemoveStudent = (groupId: string, studentId: string) => {
        if (
            currentUser?.role === 'STUDENT' &&
            currentUser.user_id !== studentId
        ) {
            toast.warning('Students can only remove themselves from groups.')
            return
        }

        if (currentUser?.role === 'STUDENT' && !canStudentMakeChanges()) {
            toast.warning(
                'Deadline has passed. You can no longer make changes to groups.'
            )
            return
        }

        setGroups((prev) =>
            prev.map((group) =>
                group.id === groupId
                    ? {
                          ...group,
                          studentsIds: (group.studentsIds ?? '')
                              .split(',')
                              .filter((id) => id.trim() !== studentId)
                              .join(','),
                      }
                    : group
            )
        )
        setHasChanges(true)
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
        } finally {
            setIsLoading(false)
        }
    }

    // Save group changes
    const handleUpdateGroups = async () => {
        setIsSaving(true)
        try {
            let allGood = true
            for (const group of groups) {
                const response = await groupService.update(group.id, {
                    studentsIds: group.studentsIds,
                })
                if (!response.success) {
                    allGood = false
                    toast.error(`Failed to update group ${group.name}`)
                    break
                }
            }

            if (allGood) {
                toast.success('Groups updated successfully')
                setHasChanges(false)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to update groups')
        } finally {
            setIsSaving(false)
        }
    }

    // Get group statistics
    const getGroupStats = () => {
        const totalStudents = batchStudents.length
        const assignedStudents = totalStudents - availableStudents.length
        const validGroups = groups.filter((group) => {
            const count = (group.studentsIds ?? '')
                .split(',')
                .filter(Boolean).length
            return (
                count >= currentProject.minPerGroup &&
                count <= currentProject.maxPerGroup
            )
        }).length

        return {
            totalStudents,
            assignedStudents,
            availableStudents: availableStudents.length,
            totalGroups: groups.length,
            validGroups,
            invalidGroups: groups.length - validGroups,
        }
    }

    useEffect(() => {
        setIsLoading(true)
        Promise.all([loadBatchStudents(), loadGroups()])
    }, [])

    // Add new useEffect to reload groups when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            loadGroups()
        }
    }, [refreshTrigger])

    const stats = getGroupStats()
    const deadlinePassed = isDeadlinePassed()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {stats.assignedStudents}/
                                    {stats.totalStudents}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Students assigned
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {stats.validGroups}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Valid groups
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {stats.invalidGroups}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Need attention
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {currentProject.creationGroupDeadLineDate && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-600" />
                                <div>
                                    <p className="text-xs font-medium">
                                        {deadlinePassed
                                            ? 'Deadline passed'
                                            : 'Deadline'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {DateTime.fromISO(
                                            currentProject.creationGroupDeadLineDate
                                        ).toFormat('dd/MM HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Instructions */}
            <Card
                className={
                    deadlinePassed && currentUser?.role === 'STUDENT'
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                        : ''
                }
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        {deadlinePassed && currentUser?.role === 'STUDENT' ? (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <div>
                            {currentUser?.role === 'TEACHER' ? (
                                <p className="text-sm">
                                    Drag and drop students to move them between
                                    groups. Groups need{' '}
                                    <Badge variant="outline">
                                        {currentProject.minPerGroup}-
                                        {currentProject.maxPerGroup} students
                                    </Badge>{' '}
                                    to be valid.
                                </p>
                            ) : deadlinePassed ? (
                                <p className="text-sm text-red-700">
                                    The deadline for group formation has passed.
                                    You can no longer make changes. The teacher
                                    will finalize group assignments.
                                </p>
                            ) : (
                                <p className="text-sm">
                                    Drag and drop yourself to join a group. You
                                    can only move yourself between groups.
                                    Groups need {currentProject.minPerGroup}-
                                    {currentProject.maxPerGroup} students.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
                    {/* Available Students Panel */}
                    <Card className="h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5" />
                                Available Students
                                <Badge variant="secondary">
                                    {availableStudents.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DroppableZone id="available">
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {availableStudents.length > 0 ? (
                                        availableStudents.map((student) => (
                                            <StudentCard
                                                key={student.user_id}
                                                student={student}
                                                canDrag={
                                                    canStudentMakeChanges() &&
                                                    (currentUser?.role !==
                                                        'STUDENT' ||
                                                        currentUser.user_id ===
                                                            student.user_id)
                                                }
                                                isDragging={
                                                    activeStudent?.user_id ===
                                                    student.user_id
                                                }
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center p-6 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">
                                                All students assigned to groups
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </DroppableZone>
                        </CardContent>
                    </Card>

                    {/* Groups Grid */}
                    <div className="space-y-4">
                        {groups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groups.map((group) => {
                                    const assignedStudents =
                                        batchStudents.filter((student) =>
                                            (group.studentsIds ?? '')
                                                .split(',')
                                                .map((id: string) => id.trim())
                                                .includes(student.user_id)
                                        )

                                    return (
                                        <DroppableZone
                                            key={group.id}
                                            id={group.id}
                                        >
                                            <GroupCard
                                                group={group}
                                                studentCount={
                                                    assignedStudents.length
                                                }
                                                minPerGroup={
                                                    currentProject.minPerGroup
                                                }
                                                maxPerGroup={
                                                    currentProject.maxPerGroup
                                                }
                                            >
                                                <div className="space-y-2">
                                                    {assignedStudents.length >
                                                    0 ? (
                                                        assignedStudents.map(
                                                            (student) => (
                                                                <StudentCard
                                                                    key={
                                                                        student.user_id
                                                                    }
                                                                    student={
                                                                        student
                                                                    }
                                                                    canDrag={
                                                                        canStudentMakeChanges() &&
                                                                        (currentUser?.role !==
                                                                            'STUDENT' ||
                                                                            currentUser.user_id ===
                                                                                student.user_id)
                                                                    }
                                                                    isDragging={
                                                                        activeStudent?.user_id ===
                                                                        student.user_id
                                                                    }
                                                                    showRemoveButton={
                                                                        canStudentMakeChanges() &&
                                                                        (currentUser?.role !==
                                                                            'STUDENT' ||
                                                                            currentUser.user_id ===
                                                                                student.user_id)
                                                                    }
                                                                    onRemove={() =>
                                                                        handleRemoveStudent(
                                                                            group.id,
                                                                            student.user_id
                                                                        )
                                                                    }
                                                                />
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="text-center p-4 text-muted-foreground border-2 border-dashed rounded-lg">
                                                            <p className="text-xs">
                                                                Drop students
                                                                here
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </GroupCard>
                                        </DroppableZone>
                                    )
                                })}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">
                                        No Groups Available
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Groups will appear here after you save
                                        your configuration settings.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeStudent && (
                        <StudentCard
                            student={activeStudent}
                            isDragging={true}
                            className="shadow-2xl rotate-3 scale-105"
                        />
                    )}
                </DragOverlay>
            </DndContext>

            {/* Save Changes */}
            {groups.length > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-4">
                        {hasChanges ? (
                            <StatusIndicator
                                type="warning"
                                icon="alert"
                                text="Unsaved changes"
                                description="Don't forget to save your group assignments"
                            />
                        ) : (
                            <StatusIndicator
                                type="success"
                                icon="check"
                                text="All changes saved"
                            />
                        )}
                    </div>

                    <Button
                        onClick={handleUpdateGroups}
                        disabled={isSaving || !hasChanges}
                        className="min-w-[140px]"
                    >
                        {isSaving ? (
                            <LoadingSpinner />
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Groups
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
