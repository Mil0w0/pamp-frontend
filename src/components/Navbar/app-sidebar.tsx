import * as React from 'react'
import { BookOpen, Footprints, Settings2, UsersRound } from 'lucide-react'

import { NavMain } from '@/components/Navbar/nav-main.tsx'
import { ProjectSwitcher } from '@/components/Navbar/project-switcher.tsx'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar.tsx'
import { Project } from '@/components/ManageProjects/types.ts'
import { useEffect } from 'react'

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
    console.log('### DEBUG STORE (global state)')
    console.log(allProjects)

    const [navLinks, setNavLinks] = React.useState<NavItem[]>(navMain)

    useEffect(() => {
        if (!currentProject) return

        const groupItems: NavSubItem[] =
            currentProject.groups?.map((group) => ({
                title: group.name,
                url: `/projects/${currentProject.id}/groups/${group.id}`,
            })) || []
        const stepItems: NavSubItem[] =
            currentProject.steps?.map((step, index) => ({
                title: `S-${index}: ` + step.name,
                url: `/projects/${currentProject.id}/steps/${step.id}`,
            })) || []

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
                    {
                        title: 'Configuration',
                        url: `/projects/${currentProject?.id}/steps/config`,
                    },
                    ...stepItems,
                ],
            },
            {
                title: 'Report settings',
                url: `/projects/${currentProject?.id}/report-definition`,
                icon: BookOpen,
            },
            {
                title: 'Settings',
                url: `/projects/${currentProject?.id}/settings`,
                icon: Settings2,
            },
        ])
    }, [currentProject])

    return (
        <Sidebar collapsible="icon" {...props} className={'top-24'}>
            <SidebarHeader>
                <ProjectSwitcher
                    projects={allProjects}
                    currentProject={currentProject}
                />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navLinks} />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
