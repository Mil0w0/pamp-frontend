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
import { DroppableZone } from '@/components/AddStudentToStudentBatch/DroppableZone'
import { AlertCircle, Save, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { StudentCard } from '@/components/ProjectPages/ProjectGroups/StudentCard.tsx'
import { StatusIndicator } from '@/components/ProjectPages/ProjectGroups/StatusIndicator.tsx'
import PlanningCalendar from '@/components/ProjectPages/OralsPlanning/PlanningCalendar.tsx'

type ProjectGroupsCompositionProps = {
    currentProject: Project
    refreshTrigger?: number
}

export default function OralPlanningComposition({
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

    // Save orals planning changes
    const handleUpdatePlanning = async () => {
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 mt-1" />
                        <div className="flex justify-between w-full items-center">
                            <p className="text-sm">
                                Generate a planning and drag and drop groups on
                                the calendar to update the planning. Orals are
                                currently set to last 15 minutes from 10h to
                                11h.
                            </p>
                            <Button>Change settings</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Teacher UI with drag-and-drop groups */}
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
                    {/* Available Students Groups Panel */}
                    <Card className="h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5" />
                                Groups information
                                <Badge variant="secondary">
                                    {groups.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div id="available">
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {groups.length > 0 ? (
                                        groups.map((group) => (
                                            <div>{group.name}</div> //todo: popover to display students in the group
                                        ))
                                    ) : (
                                        <div className="text-center p-6 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">
                                                No available groups
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orals Calendar */}
                    <div className="space-y-4">
                        {groups.length > 0 ? (
                            <PlanningCalendar groups={groups} />
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">
                                        No Groups Available
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        The order of groups will appear here
                                    </p>
                                </CardContent>
                            </Card>
                        )}
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
                </div>
            </DndContext>
            {/* Save Changes - Hide for students when group creation is set to 'STUDENT' */}
            {groups.length > 0 && !(currentUser?.role === 'STUDENT') && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-4">
                        {hasChanges ? (
                            <StatusIndicator
                                type="warning"
                                icon="alert"
                                text="Unsaved changes"
                                description="Don't forget to save the planning"
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
                        onClick={handleUpdatePlanning}
                        disabled={isSaving || !hasChanges}
                        className="min-w-[140px]"
                    >
                        {isSaving ? (
                            <LoadingSpinner />
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Planning
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
