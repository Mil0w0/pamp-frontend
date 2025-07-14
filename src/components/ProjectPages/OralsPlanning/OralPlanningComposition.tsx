import { useEffect, useState } from 'react'

import { useParams } from 'react-router'
import { Project } from '@/components/ManageProjects/types.ts'
import { toast } from 'sonner'
import {
    groupService,
    planningService,
} from '@/services/ProjectService/project-api-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { AlertCircle, Save, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { StatusIndicator } from '@/components/ProjectPages/ProjectGroups/StatusIndicator.tsx'
import PlanningCalendar from '@/components/ProjectPages/OralsPlanning/PlanningCalendar.tsx'
import { formatToShortDateAndTime } from '@/utils/dateFormatter.ts'
import { OralDTO } from '@/services/ProjectService/types.ts'

type OralPlanningProps = {
    currentProject: Project
    toggleModalSettings: () => void
}

export default function OralPlanningComposition({
    currentProject,
    toggleModalSettings,
}: OralPlanningProps) {
    const { projectId } = useParams()
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [groups, setGroups] = useState<ProjectGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [oralPlanning, setOralPlanning] = useState<OralDTO[]>([])

    // Load project groups
    const loadGroups = async () => {
        try {
            const response = await groupService.getAll(projectId || '')
            if (response.success) {
                const groups = response.data
                if (groups instanceof Array) {
                    setGroups(groups)
                    //INIT ORAL PLANNING
                    const initialOralPlanning: OralDTO[] = groups
                        .filter((group) => group.oral)
                        .map((group) => ({
                            id: group.oral?.id,
                            startTime: group.oral!.startTime,
                            endTime: group.oral!.endTime,
                            groupId: group.id,
                        }))
                    console.log('Initial planning')
                    console.log(initialOralPlanning)

                    setOralPlanning(initialOralPlanning)
                }
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
    const handleUpdatePlanning = async (oralPlanning: OralDTO[] | null) => {
        let allGood = true
        if (!oralPlanning) return
        setIsSaving(true)
        try {
            for (const oral of oralPlanning) {
                //UPDATE
                if (oral.id) {
                    const { id, endTime, startTime } = oral
                    const response = await planningService.update(id, {
                        endTime: endTime,
                        startTime: startTime,
                    })
                    if (!response.success) {
                        allGood = false
                    }
                } else {
                    //CREATE
                    const response = await planningService.create(oral)
                    if (!response.success) {
                        toast.error(response.error)
                        return
                    }
                }
            }

            if (allGood) {
                toast.success('Planning updated successfully')
                setHasChanges(false)
            } else {
                toast.error('Error while updating planning.')
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
        Promise.all([loadGroups()])
    }, [])

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
                                the calendar to update the schedule.
                                {currentProject.oralsConfigStartTime &&
                                    currentProject.oralsConfigEndTime && (
                                        <>
                                            {' '}
                                            Orals are scheduled from{' '}
                                            <strong>
                                                {formatToShortDateAndTime(
                                                    currentProject.oralsConfigStartTime
                                                )}
                                            </strong>{' '}
                                            to{' '}
                                            <strong>
                                                {formatToShortDateAndTime(
                                                    currentProject.oralsConfigEndTime
                                                )}
                                            </strong>
                                            .
                                            {currentProject.oralsConfigDuration && (
                                                <>
                                                    {' '}
                                                    Each oral should last{' '}
                                                    <strong>
                                                        {
                                                            currentProject.oralsConfigDuration
                                                        }{' '}
                                                        minutes
                                                    </strong>
                                                    .
                                                </>
                                            )}
                                        </>
                                    )}
                            </p>

                            <Button onClick={toggleModalSettings}>
                                Change settings
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Teacher UI */}

            <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
                {/* Available Students Groups Panel */}
                <Card className="h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Groups information
                            <Badge variant="secondary">{groups.length}</Badge>
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
                    {groups.length > 0 &&
                    currentProject?.oralsConfigStartTime ? (
                        <PlanningCalendar
                            groups={groups}
                            projectConfig={currentProject}
                            oralPlanning={oralPlanning}
                            setOralPlanning={setOralPlanning}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-medium mb-2">
                                    No Groups Available or no config for orals
                                    yet.
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    The order of groups will appear here once
                                    you save orals config settings.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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
                        onClick={() => handleUpdatePlanning(oralPlanning)}
                        disabled={isSaving}
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
