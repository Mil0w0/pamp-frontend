import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect } from 'react'
import {
    fetchAllProjects,
    fetchGroupById,
    fetchProjectById,
} from '@/store/project.slice.ts'
import { Link, useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { SquareArrowOutUpRight } from 'lucide-react'

export default function ProjectGroupsById() {
    const { projectId, groupId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject, currentGroup } = useSelector(
        (state: RootState) => state.project
    )

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (groupId) {
            dispatch(fetchGroupById(groupId))
        }
        dispatch(fetchAllProjects())
    }, [dispatch, projectId, groupId])

    if (!currentProject || !currentGroup) {
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
                                <BreadcrumbLink
                                    href={`/projects/${currentProject.id}/settings`}
                                >
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink
                                    href={`/projects/${currentProject.id}/groups/${currentGroup.id}`}
                                >
                                    {currentGroup.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                <h1 className="text-2xl">{currentGroup.name}</h1>
                <section id="general">
                    <h2 className="text-xl">Common</h2>
                    <h2 className="text-lg">Grade</h2>
                </section>

                <section id="submissions">
                    <h2 className="text-xl">Submissions</h2>
                </section>

                <section id="submissions">
                    <h2 className="text-xl"> Project report</h2>
                    {currentGroup.reportSubmitted ? (
                        <div>
                            <p className="text-sm">
                                Report submitted on{' '}
                                {currentGroup.reportSubmittedDate}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm">Report not submitted yet</p>
                    )}
                    <Link
                        className="cursor-pointer underline text-primary flex gap-2 mt-2"
                        to={{
                            pathname: '/',
                        }}
                    >
                        Accéder à l'éditeur
                        <SquareArrowOutUpRight />
                    </Link>
                </section>

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
