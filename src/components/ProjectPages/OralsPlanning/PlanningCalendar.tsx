import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import luxonPlugin from '@fullcalendar/luxon'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateTime } from 'luxon'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { EventInput, EventDropArg } from '@fullcalendar/core'
import { EventContentArg } from '@fullcalendar/core'
import { Project } from '@/components/ManageProjects/types.ts'
import { toast } from 'sonner'
import { OralDTO } from '@/services/ProjectService/types.ts'
import { useCallback, useEffect, useState } from 'react'
import { planningService } from '@/services/ProjectService/project-api-client.ts'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Button } from '@/components/ui/button.tsx'
import { DicesIcon } from 'lucide-react'

export default function PlanningCalendar({
    projectConfig,
    groups,
    oralPlanning,
    setOralPlanning,
}: {
    groups: ProjectGroup[]
    projectConfig: Project
    oralPlanning: OralDTO[]
    setOralPlanning: React.Dispatch<React.SetStateAction<OralDTO[]>>
}) {
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [events, setEvents] = useState<EventInput[]>([])
    const [otherOrals, setOtherOrals] = useState<EventInput[]>([])

    const generateInitialOralPlanning = useCallback(() => {
        const {
            oralsConfigStartTime,
            oralsConfigEndTime,
            oralsConfigDuration,
        } = projectConfig

        const start = DateTime.fromISO(oralsConfigStartTime)
        const end = DateTime.fromISO(oralsConfigEndTime)

        if (!start.isValid || !end.isValid) {
            console.warn(
                'Invalid start or end time format. Cannot generate oral events.'
            )
            return []
        }

        let duration = oralsConfigDuration
        if (!duration || isNaN(duration)) {
            const totalMinutes = end.diff(start, 'minutes').minutes
            duration = Math.floor(totalMinutes / groups.length)

            if (duration <= 0) {
                console.warn(
                    'Calculated duration is invalid. Cannot generate oral events.'
                )
                toast.error("Couldn't generate orals planning. Duration error")
                return []
            }
        }

        let current = start
        const generated: OralDTO[] = []

        for (const group of groups) {
            const startTime = current.toISO()
            const endTime = current.plus({ minutes: duration }).toISO()

            // Handle null case - skip if ISO conversion fails
            if (!startTime || !endTime) {
                console.warn('Failed to convert DateTime to ISO string')
                continue
            }

            generated.push({
                startTime,
                endTime,
                groupId: group.id,
                // No ID means it's not saved in database yet
            })
            current = current.plus({ minutes: duration })
        }

        return generated
    }, [groups, projectConfig])

    const generateOralEvents = useCallback(() => {
        const newEvents: EventInput[] = []
        const { oralsConfigDuration } = projectConfig

        for (const oral of oralPlanning) {
            const group = groups.find((g) => g.id === oral.groupId)
            if (!group) continue

            newEvents.push({
                id: oral.id || `temp-${oral.groupId}`,
                title: group.name,
                start: oral.startTime,
                end: oral.endTime,
                extendedProps: {
                    groupId: group.id,
                    tooltip: `${group.name}\nDuration: ${oralsConfigDuration} min`,
                    isExisting: !!oral.id,
                },
            })
        }

        return newEvents
    }, [groups, projectConfig, oralPlanning])

    const loadOtherProjectOrals = useCallback(async () => {
        if (!currentUser) return
        try {
            const response = await planningService.getAllTeacherOrals(
                projectConfig.id,
                currentUser.user_id
            )
            if (response.success && response.data) {
                setOtherOrals(
                    response.data.map((oral) => ({
                        id: `other-${oral.id}`,
                        start: oral.startTime,
                        end: oral.endTime,
                        display: 'background',
                        backgroundColor: '#d1d5db',
                        overlap: false,
                    }))
                )
            }
        } catch (error) {
            console.error('Failed to load other project orals:', error)
        }
    }, [currentUser, projectConfig.id])

    // Generate initial oral planning if none exists
    useEffect(() => {
        if (oralPlanning.length === 0 && groups.length > 0) {
            const generated = generateInitialOralPlanning()
            if (generated.length > 0) {
                setOralPlanning(generated)
            }
        }
    }, [
        groups,
        oralPlanning.length,
        generateInitialOralPlanning,
        setOralPlanning,
    ])

    // Generate events when oralPlanning changes
    useEffect(() => {
        const generatedEvents = generateOralEvents()
        setEvents(generatedEvents)
    }, [generateOralEvents])

    // Load other orals on mount
    useEffect(() => {
        loadOtherProjectOrals()
    }, [loadOtherProjectOrals])

    const handlePlanningChanged = (dropInfo: EventDropArg) => {
        const groupId: string = dropInfo.event.extendedProps.groupId
        const newStart = dropInfo.event.start?.toISOString()
        const newEnd = dropInfo.event.end?.toISOString()

        if (!newStart || !newEnd || !groupId) return

        setOralPlanning((prev: OralDTO[]) => {
            return prev.map((oral) =>
                oral.groupId === groupId
                    ? {
                          ...oral,
                          startTime: newStart,
                          endTime: newEnd,
                      }
                    : oral
            )
        })
    }

    const handleRandomizeOrder = () => {
        if (oralPlanning.length === 0) return

        const { oralsConfigDuration } = projectConfig

        // Get the original start time from the first oral
        const originalStartTime = DateTime.fromISO(oralPlanning[0].startTime)

        const shuffledPlanning = [...oralPlanning]

        // Fisher-Yates shuffle algorithm
        for (let i = shuffledPlanning.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledPlanning[i], shuffledPlanning[j]] = [
                shuffledPlanning[j],
                shuffledPlanning[i],
            ]
        }

        // Reassign time slots to shuffled groups
        const updatedPlanning = shuffledPlanning.map((oral, index) => {
            const newStartTime = originalStartTime.plus({
                minutes: oralsConfigDuration * index,
            })
            const newEndTime = newStartTime.plus({
                minutes: oralsConfigDuration,
            })

            const startTimeISO = newStartTime.toISO()
            const endTimeISO = newEndTime.toISO()

            // Handle null case - this shouldn't happen with valid DateTime objects
            if (!startTimeISO || !endTimeISO) {
                console.warn(
                    'Failed to convert DateTime to ISO string during randomization'
                )
                return oral // Return original if conversion fails
            }

            return {
                ...oral,
                startTime: startTimeISO,
                endTime: endTimeISO,
            }
        })

        setOralPlanning(updatedPlanning)
        toast.success('Oral presentation order randomized successfully!')
    }

    const renderEventContent = (eventInfo: EventContentArg) => {
        const { event } = eventInfo

        return (
            <div className="group relative p-1 rounded-md shadow-sm bg-primary text-primary-foreground text-sm font-medium">
                <div>{event.title}</div>
                <div className="text-xs opacity-80">
                    {DateTime.fromISO(event.startStr).toFormat('HH:mm')} →{' '}
                    {DateTime.fromISO(event.endStr).toFormat('HH:mm')}
                </div>
                {/* Fixed tooltip positioning and visibility */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                    {eventInfo.event.extendedProps.tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-popover"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    onClick={handleRandomizeOrder}
                    disabled={oralPlanning.length === 0}
                >
                    <DicesIcon />
                    Randomize Order
                </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                <FullCalendar
                    plugins={[
                        dayGridPlugin,
                        luxonPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                    ]}
                    initialView="timeGridWeek"
                    events={[...events, ...otherOrals]}
                    eventContent={renderEventContent}
                    height="auto"
                    timeZone="local"
                    slotMinTime="08:00:00"
                    slotMaxTime="23:00:00"
                    eventMinHeight={40}
                    allDaySlot={false}
                    slotDuration="00:15:00"
                    scrollTime={DateTime.fromISO(
                        projectConfig.oralsConfigStartTime
                    ).toFormat('HH:mm:ss')}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    editable={true}
                    eventDrop={handlePlanningChanged}
                    eventOverlap={false}
                    selectOverlap={false}
                />
            </div>
        </div>
    )
}
