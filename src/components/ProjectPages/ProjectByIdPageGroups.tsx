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
import { useEffect } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'

export default function ProjectByIdPageGroups() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        dispatch(fetchAllProjects())
    }, [dispatch, projectId])

    if (!currentProject) {
        return <Skeleton />
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
                                <BreadcrumbLink href="#">
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Group</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-2xl">Group : </h1>
                <div className="grid auto-rows-min gap-4 md:grid-cols-2"></div>

                <Button
                    onClick={() => toast.warning('Not implemented yet')}
                    className="self-start"
                >
                    Save changes
                </Button>
            </div>
        </div>
    )
}
