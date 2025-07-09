import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect, useState } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import { Step } from '@/components/ProjectPages/types.ts'
import PampButton from '@/components/ui/pamp-button.tsx'
import { StepBox } from '@/components/ProjectPages/Steps/StepBox.tsx'
import { ConformityRules } from '@/components/ProjectPages/ConformityRules/types.ts'

export default function ProjectByIdPageStepConfig() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)
    const { currentUser } = useSelector((state: RootState) => state.user)
    const [steps, setSteps] = useState<Partial<Step>[]>([])

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (!currentUser) return
        dispatch(fetchAllProjects(currentUser.user_id))
    }, [dispatch, projectId, currentUser])

    useEffect(() => {
        if (currentProject && currentProject.steps) {
            setSteps(currentProject.steps)
        }
    }, [currentProject])

    if (!currentProject) {
        return <Skeleton />
    }

    const handleStepChange = (
        index: number,
        field: keyof Step,
        value: string | boolean | ConformityRules[]
    ) => {
        console.log(steps)
        setSteps((prevSteps) =>
            prevSteps.map((step, i) =>
                i === index ? { ...step, [field]: value } : step
            )
        )
    }

    const handleProjectEditSave = async () => {
        try {
            const response = await projectService.updateSteps(
                currentProject.id,
                steps
            )
            if (response.success) {
                if (response.data) {
                    toast.success('Successfully updated steps')
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong when updating steps')
            console.error(error)
        }
    }
    const addStepSkeleton = () => {
        console.log('adding skeleton step ')
        const initialNewStep: Partial<Step> = {
            name: '',
            description: '',
            hasMandatorySubmission: false,
            allowSubmittingAfterDeadLine: true,
        }
        setSteps((prev) => [...prev, initialNewStep])
    }
    const removeStepSkeleton = (indexToDelete: number) => {
        console.log('remove skeleton step ')
        const stepDeleted = steps[indexToDelete]
        setSteps((prevSteps) =>
            prevSteps.filter((_, index) => index !== indexToDelete)
        )
        toast.warning('To delete step save changes or ', {
            action: {
                label: 'Undo',
                onClick: () => {
                    setSteps((prevSteps) => {
                        const newSteps = [...prevSteps]
                        newSteps.splice(indexToDelete, 0, stepDeleted)
                        return newSteps
                    })
                },
            },
        })
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
                                <BreadcrumbLink
                                    href={`/projects/${currentProject.id}/settings`}
                                >
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Steps settings</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-2xl">Manage steps for this project</h1>
                <PampButton message={'Add a step'} onClick={addStepSkeleton} />

                {steps.length > 0 ? (
                    <div>
                        <div className="flex flex-col items-center gap-2">
                            {steps.map((step, index) => (
                                <StepBox
                                    step={step}
                                    index={index}
                                    key={index}
                                    handleStepChange={handleStepChange}
                                    removeItem={removeStepSkeleton}
                                />
                            ))}
                        </div>
                        <Button
                            onClick={() => handleProjectEditSave()}
                            className="self-start mt-4"
                        >
                            Save changes
                        </Button>
                    </div>
                ) : (
                    <div className="flex">No steps for this project</div>
                )}
            </div>
        </div>
    )
}
