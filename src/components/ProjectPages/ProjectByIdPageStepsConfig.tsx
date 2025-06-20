import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label.tsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { ChangeEvent, useEffect, useState } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { ChevronDownIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { DateTime } from 'luxon'
import { toast } from 'sonner'
import ProjectGroupsComposition from '@/components/ProjectPages/ProjectGroups/ProjectGroupsComposition.tsx'
import { EditProjectDto } from '@/components/ManageProjects/types.ts'
import { projectService } from '@/services/ProjectService/project-api-client.ts'

const initialData: EditProjectDto = {}
export default function ProjectByIdPageStepConfig() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deadLine, setDate] = useState<Date | undefined>(undefined)
    const [deadLineTime, setDeadLineTime] = useState(
        DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    )
    const [groupProjectData, setGroupProjectData] =
        useState<EditProjectDto>(initialData)
    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        dispatch(fetchAllProjects())
    }, [dispatch, projectId])

    if (!currentProject) {
        return <Skeleton />
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        setGroupProjectData((prev) => ({ ...prev, [id]: value }))
    }

    const handleProjectEditSave = async () => {
        setIsLoading(true)
        try {
            const response = await projectService.editProject(
                currentProject.id,
                groupProjectData
            )
            if (response.success) {
                if (response.data && !(response.data instanceof Array)) {
                    toast.success('Successfully updated')
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong when updating')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/projects">
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Groups settings</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-2xl">Update groups composition</h1>
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div className="grid w-full max-w-sm">
                        <RadioGroup
                            defaultValue={currentProject.groupsCreator}
                            onValueChange={(value: string) =>
                                setGroupProjectData((prev) => ({
                                    ...prev,
                                    groupsCreator: value as
                                        | 'TEACHER'
                                        | 'RANDOM'
                                        | 'STUDENT',
                                }))
                            }
                        >
                            <h2 className="text-xl">
                                Who is allowed to make groups ?{' '}
                            </h2>
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="TEACHER" id="r1" />
                                <Label htmlFor="r1">Teacher</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="STUDENT" id="r2" />
                                <Label htmlFor="r2">Students</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <RadioGroupItem value="RANDOM" id="r3" />
                                <Label htmlFor="r3">System (automatic)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid w-full max-w-sm justify-end">
                        <Label className="mb-1" htmlFor="maxPerGroup">
                            Max students per group
                        </Label>
                        <Input
                            className="mb-2"
                            id="maxPerGroup"
                            type="number"
                            min={1}
                            onChange={handleChange}
                            defaultValue={currentProject.maxPerGroup}
                        />

                        <Label className="mb-1" htmlFor="minPerGroup">
                            Min students per group
                        </Label>
                        <Input
                            className="mb-2"
                            id="minPerGroup"
                            type="number"
                            min={1}
                            onChange={handleChange}
                            defaultValue={currentProject.minPerGroup}
                        />

                        <Label className="mb-1" htmlFor="maxGroups">
                            Max groups allowed
                        </Label>
                        <Input
                            className="mb-2"
                            id="maxGroups"
                            type="number"
                            min={1}
                            onChange={handleChange}
                            defaultValue={currentProject.maxGroups}
                        />

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-3">
                                <Label
                                    htmlFor="creationGroupDeadLineDate"
                                    className="px-1"
                                >
                                    Deadline to create group
                                </Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="creationGroupDeadLineDate"
                                            className="w-32 justify-between font-normal"
                                            disabled={
                                                isLoading ||
                                                groupProjectData.groupsCreator !==
                                                    'STUDENT'
                                            }
                                        >
                                            {groupProjectData.creationGroupDeadLineDate
                                                ? DateTime.fromISO(
                                                      groupProjectData.creationGroupDeadLineDate
                                                  ).toFormat('dd/MM/yyyy')
                                                : currentProject.creationGroupDeadLineDate
                                                  ? DateTime.fromISO(
                                                        currentProject.creationGroupDeadLineDate
                                                    ).toFormat('dd/MM/yyyy')
                                                  : 'Select date'}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown"
                                            onSelect={(selected) => {
                                                if (selected) {
                                                    const [
                                                        hourStr,
                                                        minuteStr,
                                                        secondStr = '0',
                                                    ] = deadLineTime.split(':')
                                                    const formattedDate =
                                                        DateTime.fromJSDate(
                                                            selected
                                                        ).set({
                                                            hour: parseInt(
                                                                hourStr
                                                            ),
                                                            minute: parseInt(
                                                                minuteStr
                                                            ),
                                                            second: parseInt(
                                                                secondStr
                                                            ),
                                                        })

                                                    const isoString =
                                                        formattedDate.toISO()

                                                    console.log(isoString)

                                                    setGroupProjectData(
                                                        //@ts-expect-error later
                                                        (prev) => ({
                                                            ...prev,
                                                            creationGroupDeadLineDate:
                                                                isoString,
                                                        })
                                                    )
                                                }
                                                setOpen(false)
                                                setDate(selected)
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {/*TO DO : HANDLE TIME*/}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="time" className="px-1">
                                    Time
                                </Label>
                                <Input
                                    type="time"
                                    id="time"
                                    step="1"
                                    defaultValue={deadLineTime}
                                    onChange={(e) => {
                                        const newTime = e.target.value
                                        setDeadLineTime(newTime)

                                        if (deadLine) {
                                            const formattedDate =
                                                DateTime.fromJSDate(
                                                    deadLine
                                                ).toFormat('yyyy-MM-dd')
                                            const combined = `${formattedDate}T${newTime}`

                                            setGroupProjectData((prev) => ({
                                                ...prev,
                                                creationGroupDeadLineDate:
                                                    combined,
                                            }))
                                        }
                                    }}
                                    disabled={
                                        isLoading ||
                                        groupProjectData.groupsCreator !==
                                            'STUDENT'
                                    }
                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => handleProjectEditSave()}
                    className="self-start"
                >
                    Save config changes
                </Button>

                <ProjectGroupsComposition currentProject={currentProject} />
            </div>
        </div>
    )
}
