import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import luxonPlugin from '@fullcalendar/luxon'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateTime } from 'luxon'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { EventInput } from '@fullcalendar/core'
import { EventContentArg } from '@fullcalendar/core'

export default function PlanningCalendar({
    groups,
}: {
    groups: ProjectGroup[]
}) {
    const generateOralEvents = () => {
        let current = DateTime.local()
        const oralDuration = 15
        const events: EventInput[] = []

        for (const group of groups) {
            // if (current >= end) break

            events.push({
                id: group.id,
                title: group.name,
                start: current.toISO(),
                end: current.plus({ minutes: oralDuration }).toISO(),
                extendedProps: {
                    tooltip: `${group.name}\nDuration: ${oralDuration} min`,
                },
            })

            current = current.plus({ minutes: oralDuration })
        }

        return events
    }

    const renderEventContent = (eventInfo: EventContentArg) => {
        const { event } = eventInfo

        return (
            <div className="p-1 rounded-md shadow-sm bg-primary text-primary-foreground text-sm font-medium">
                <div>{event.title}</div>
                <div className="text-xs opacity-80">
                    {DateTime.fromISO(event.startStr).toFormat('HH:mm')} →{' '}
                    {DateTime.fromISO(event.endStr).toFormat('HH:mm')}
                </div>
                {/*Doesnt' show tooltip:*/}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow z-50">
                    {eventInfo.event.extendedProps.tooltip}
                </div>
            </div>
        )
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <FullCalendar
                plugins={[
                    dayGridPlugin,
                    luxonPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                ]}
                initialView="timeGridWeek"
                events={generateOralEvents()}
                eventContent={renderEventContent}
                height="auto"
                timeZone="local"
                slotMinTime="08:00:00"
                slotMaxTime="23:00:00"
                eventMinHeight={40}
                allDaySlot={false}
                slotDuration="00:15:00"
                scrollTime="19:00:00"
                slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }}
                editable={true}
            />
        </div>
    )
}
