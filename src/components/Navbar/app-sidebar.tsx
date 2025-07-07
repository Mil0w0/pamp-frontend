import * as React from 'react'
import { useEffect } from 'react'
import { BookOpen, Footprints, Settings2, UsersRound } from 'lucide-react'

import { NavMain } from '@/components/Navbar/nav-main.tsx'
import { ProjectSwitcher } from '@/components/Navbar/project-switcher.tsx'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar.tsx'
import { Project } from '@/components/ManageProjects/types.ts'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { Button } from '@/components/ui/button.tsx'
import { projectService } from '@/services/ProjectService/project-api-client.ts'
import { toast } from 'sonner'
import { fetchProjectById } from '@/store/project.slice.ts'

export type NavSubItem = {
    title: string
    url: string
}

export type NavItem = {
    title: string
    url: string
    icon: React.ElementType
    isActive?: boolean
    items?: NavSubItem[]
}

// This is inital fake data.
const navMain = [
    {
        title: 'Groups settings',
        url: '/projects/?/groups',
        icon: UsersRound,
        isActive: true,
        items: [
            {
                title: 'Composition',
                url: '/projects/?/settings',
            },
        ],
    },
    {
        title: 'Project steps',
        url: '/projects/?/steps',
        icon: Footprints,
    },
    {
        title: 'Report settings',
        url: '#',
        icon: BookOpen,
    },
    {
        title: 'Settings',
        url: '#',
        icon: Settings2,
    },
]
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
    currentProject: Project | null
    allProjects: Project[]
}

export function AppSidebar({
    currentProject,
    allProjects,
    ...props
}: AppSidebarProps) {
    const { currentUser } = useSelector((state: RootState) => state.user)
    const dispatch = useDispatch<AppDispatch>()

    const [navLinks, setNavLinks] = React.useState<NavItem[]>(navMain)

    useEffect(() => {
        if (!currentProject) return
        if (!currentUser) return

        const isStudent = currentUser?.role === 'STUDENT'

        //Show groups that the student is in.
        const groupItems: NavSubItem[] =
            currentProject.groups
                ?.filter((group) =>
                    isStudent
                        ? group.studentsIds?.includes(currentUser.user_id)
                        : true
                )
                .sort((a, b) => {
                    const getNumber = (name: string) =>
                        parseInt(name.replace(/\D/g, ''))

                    return getNumber(a.name) - getNumber(b.name)
                })
                .map((group) => ({
                    title: group.name,
                    url: `/projects/${currentProject.id}/groups/${group.id}`,
                })) || []
        const stepItems: NavSubItem[] =
            currentProject.steps?.map((step, index) => ({
                title: `S-${index}: ` + step.name,
                url: `/projects/${currentProject.id}/steps/${step.id}`,
            })) || []

        //Show the config page only if user is a teacher
        setNavLinks([
            {
                title: 'Groups settings',
                url: `/projects/${currentProject.id}/groups`,
                icon: UsersRound,
                isActive: true,
                items: [
                    {
                        title: 'Composition',
                        url: `/projects/${currentProject.id}/groups`,
                    },
                    ...groupItems,
                ],
            },
            {
                title: 'Project steps',
                url: `/projects/${currentProject.id}/steps`,
                icon: Footprints,
                items: [
                    ...(!isStudent
                        ? [
                              {
                                  title: 'Configuration',
                                  url: `/projects/${currentProject.id}/steps/config`,
                              },
                          ]
                        : []),
                    ...stepItems,
                ],
            },
            ...(!isStudent
                ? [
                      {
                          title: 'Settings',
                          url: `/projects/${currentProject.id}/settings`,
                          icon: Settings2,
                      },

                      {
                          title: 'Report settings',
                          url: `/projects/${currentProject?.id}/report-definition`,
                          icon: BookOpen,
                      },
                  ]
                : [
                      {
                          title: 'Go to report',
                          url: `/student/report/${currentProject?.id}/${currentProject.groups.find((group) => group.studentsIds.split(',').includes(currentUser?.user_id))?.id}`,
                          icon: BookOpen,
                      },
                  ]),
        ])
    }, [currentProject, currentUser])

    const publishProject = async () => {
        if (!currentProject) return
        if (!currentProject.id) return
        try {
            const response = await projectService.editProject(
                currentProject.id,
                {
                    isPublished: !currentProject.isPublished,
                }
            )
            if (response.success) {
                toast.success(
                    'Successfully published. Students will receive a mail '
                )
                dispatch(fetchProjectById(currentProject.id))
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error(`Une erreur est survenue. ${error}`)
        }
    }

    return (
        <Sidebar
            collapsible="icon"
            {...props}
            className={'top-24 h-[calc(100vh-6rem)]'}
        >
            <SidebarHeader>
                <ProjectSwitcher
                    projects={allProjects}
                    currentProject={currentProject}
                />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navLinks} />
            </SidebarContent>
            <SidebarFooter className={'items-center pb-5'}>
                <Button
                    onClick={() => publishProject()}
                    className="w-fit"
                    variant={
                        currentProject?.isPublished ? 'outline' : 'default'
                    }
                >
                    {currentProject?.isPublished
                        ? 'Draft project'
                        : 'Publish project'}
                </Button>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
