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
import { useEffect, useState } from 'react'
import {
    fetchAllProjects,
    fetchGroupById,
    fetchProjectById,
} from '@/store/project.slice.ts'
import { Link, useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { SquareArrowOutUpRight } from 'lucide-react'
import { DraggableStudent } from '@/components/AddStudentToStudentBatch/DraggableStudent.tsx'
import { ProjectGroup } from '@/components/ProjectPages/types.ts'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'
import { toast } from 'sonner'
import { StepsSubmissionDataTable } from '@/components/ProjectPages/ProjectGroups/StepsSubmissionDataTable.tsx'
import { sumbissionService } from '@/services/SubmissionService/submission-api-client.ts'
import { SubmissionResponse } from '@/services/SubmissionService/types.ts'

export default function ProjectGroupsById() {
    const { projectId, groupId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject, currentGroup } = useSelector(
        (state: RootState) => state.project
    )
    const [allStudents, setAllStudents] = useState<Student[]>([])
    const [groupsStudents, setGroupsStudents] = useState<Student[]>([])
    const [submissions, setSubmissions] = useState<SubmissionResponse[] | null>(
        null
    )

    const getStudentsForGroup = (
        group: ProjectGroup,
        allStudents: Student[]
    ) => {
        console.log(group)
        const ids = (group.studentsIds ?? '')
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        setGroupsStudents(
            allStudents.filter((student) => ids.includes(student.user_id))
        )
    }
    const getAllStudents = async () => {
        try {
            const response = await authService.getStudents()
            if (response.success) {
                return response.data as Student[]
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Something went wrong.')
            console.error(error)
        }
    }
    const loadAllGroupsSubmissions = async () => {
        if (!groupId) return
        if (!projectId) return
        try {
            const response = await sumbissionService.getAllByGroup(
                groupId,
                projectId
            )
            if (response.success) {
                if (response.data) {
                    setSubmissions(response.data)
                    console.log(response.data)
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error : Error while fetching submission')
            console.error(error)
        }
    }

    useEffect(() => {
        getAllStudents()
            .then((students) => {
                if (typeof students !== 'undefined') {
                    setAllStudents(students)
                }
            })
            .catch((error) => console.log(error))
    }, [])

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (groupId) {
            dispatch(fetchGroupById(groupId))
        }
        dispatch(fetchAllProjects())
    }, [dispatch, projectId, groupId])

    useEffect(() => {
        if (currentGroup && allStudents.length > 0) {
            getStudentsForGroup(currentGroup, allStudents)
            loadAllGroupsSubmissions()
        }
    }, [currentGroup, allStudents])

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
                    <h2 className="text-xl">Students: </h2>
                    <div className="flex flex-col space-y-2 w-1/4">
                        {groupsStudents.length > 0 ? (
                            groupsStudents.map((student) => (
                                <DraggableStudent
                                    key={student.user_id}
                                    student={student}
                                />
                            ))
                        ) : (
                            <div className="text-muted-foreground text-sm">
                                No students yet
                            </div>
                        )}
                    </div>
                </section>

                <section id="submissions">
                    <h2 className="text-xl font-semibold mb-4">
                        Submissions by Step
                    </h2>
                    <StepsSubmissionDataTable
                        groupId={currentGroup.id}
                        steps={currentProject.steps}
                        submissions={submissions}
                    />
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
            </div>
        </div>
    )
}
