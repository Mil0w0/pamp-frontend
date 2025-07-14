import { useState } from 'react'
import { DateTime } from 'luxon'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { EditProjectDto } from '@/components/ManageProjects/types.ts'

export function OralSettingsDialog({
    showConfirmDialog,
    setShowConfirmDialog,
    setProject,
    fieldErrors,
    clearFieldError,
    isLoading,
    handleCancelSave,
    onSave,
}: {
    showConfirmDialog: boolean
    setShowConfirmDialog: (open: boolean) => void
    projectDTO: EditProjectDto
    setProject: (project: EditProjectDto) => void
    fieldErrors: {
        oralsConfigEndTime?: boolean
        oralsConfigStartTime?: boolean
        oralsConfigDuration?: boolean
    }
    clearFieldError: (fieldName: keyof typeof fieldErrors) => void
    isLoading: boolean
    handleCancelSave: () => void
    onSave: (dto: EditProjectDto) => void
}) {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [startTime, setStartTime] = useState(DateTime.now().toFormat('HH:mm'))
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [endTime, setEndTime] = useState(
        DateTime.now().plus({ hour: 2 }).toFormat('HH:mm')
    )
    const [duration, setDuration] = useState<number | ''>('')

    // Popover open states
    const [startOpen, setStartOpen] = useState(false)
    const [endOpen, setEndOpen] = useState(false)

    const handleSave = () => {
        if (!startDate) return
        if (!endDate) return
        const start = DateTime.fromJSDate(startDate).set({
            hour: DateTime.fromFormat(startTime, 'HH:mm').hour,
            minute: DateTime.fromFormat(startTime, 'HH:mm').minute,
        })
        const end = DateTime.fromJSDate(endDate).set({
            hour: DateTime.fromFormat(endTime, 'HH:mm').hour,
            minute: DateTime.fromFormat(endTime, 'HH:mm').minute,
        })

        const updatedProject: EditProjectDto = {
            oralsConfigStartTime: start.toISO(),
            oralsConfigEndTime: end.toISO(),
            oralsConfigDuration: duration === '' ? null : Number(duration),
        }
        console.log(updatedProject)

        setProject(updatedProject)
        onSave(updatedProject)
        setShowConfirmDialog(false)
    }

    return (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Change orals settings
                    </DialogTitle>
                    <DialogDescription className="space-y-4">
                        <p>
                            You must set a starting time and end time for the
                            orals. If you do not specify a duration for each
                            oral, it will be calculated to fit into the range
                            given.
                        </p>

                        {/* Start datetime */}
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">
                                Orals start date time
                            </Label>
                            <Popover
                                open={startOpen}
                                onOpenChange={setStartOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={
                                            'w-full justify-between h-10 font-normal ' +
                                            (fieldErrors.oralsConfigStartTime
                                                ? 'border-red-500'
                                                : '')
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {startDate
                                                ? DateTime.fromJSDate(
                                                      startDate
                                                  ).toFormat('dd/MM/yyyy')
                                                : 'Select date'}
                                        </div>
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <CalendarComponent
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={startDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                clearFieldError(
                                                    'oralsConfigStartTime'
                                                )
                                                setStartDate(date)
                                                setStartOpen(false)
                                            }
                                        }}
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => {
                                    clearFieldError('oralsConfigStartTime')
                                    setStartTime(e.target.value)
                                }}
                                className={
                                    'h-10 ' +
                                    (fieldErrors.oralsConfigStartTime
                                        ? 'border-red-500'
                                        : '')
                                }
                            />
                        </div>

                        {/* End datetime */}
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">
                                Orals end date time
                            </Label>
                            <Popover open={endOpen} onOpenChange={setEndOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={
                                            'w-full justify-between h-10 font-normal' +
                                            (fieldErrors.oralsConfigEndTime
                                                ? 'border-red-500'
                                                : '')
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {endDate
                                                ? DateTime.fromJSDate(
                                                      endDate
                                                  ).toFormat('dd/MM/yyyy')
                                                : 'Select date'}
                                        </div>
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <CalendarComponent
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={endDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                clearFieldError(
                                                    'oralsConfigEndTime'
                                                )
                                                setEndDate(date)
                                                setEndOpen(false)
                                            }
                                        }}
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => {
                                    clearFieldError('oralsConfigEndTime')
                                    setEndTime(e.target.value)
                                }}
                                className={
                                    'h-10' +
                                    (fieldErrors.oralsConfigEndTime
                                        ? 'border-red-500'
                                        : '')
                                }
                            />
                        </div>

                        {/* Optional duration */}
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">
                                Duration per oral (minutes, optional)
                            </Label>
                            <Input
                                type="number"
                                value={duration}
                                onChange={(e) => {
                                    clearFieldError('oralsConfigDuration')
                                    setDuration(
                                        e.target.value === ''
                                            ? ''
                                            : parseInt(e.target.value)
                                    )
                                }}
                                min={1}
                                placeholder="15"
                                className={
                                    'h-10' +
                                    (fieldErrors.oralsConfigDuration
                                        ? 'border-red-500'
                                        : '')
                                }
                            />
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelSave}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
