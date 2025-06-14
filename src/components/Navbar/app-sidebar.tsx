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

// This is inital fake data.
const navMain = [
    {
        title: 'Groups settings',
        url: '/projects/4ac3a0a2-3abe-4868-9339-be30339e7e0b/groups',
        icon: UsersRound,
        isActive: true,
        items: [
            {
                title: 'Composition',
                url: '/projects/4ac3a0a2-3abe-4868-9339-be30339e7e0b/settings',
            },
        ],
    },
    {
        title: 'Project steps',
        url: '#',
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
    console.log(currentProject)
    console.log(allProjects)

    const [navLinks, setNavLinks] = React.useState<any>(navMain)

    useEffect(() => {
        setNavLinks([
            {
                title: 'Groups settings',
                url: `/projects/${currentProject?.id}/groups`,
                icon: UsersRound,
                isActive: true,
                items: [
                    {
                        title: 'Composition',
                        url: `/projects/${currentProject?.id}/groups`,
                    },
                    {
                        title: 'Group 1',
                        url: `/projects/${currentProject?.id}/groups/:groupID`,
                    },
                    {
                        title: 'Group 2',
                        url: '#',
                    },
                    {
                        title: 'Group 3',
                        url: '#',
                    },
                ],
            },
            {
                title: 'Project steps',
                url: '#',
                icon: Footprints,
                items: [
                    {
                        title: 'Step 1',
                        url: `/projects/${currentProject?.id}/steps/:stepID`,
                    },
                    {
                        title: 'Step 2',
                        url: '#',
                    },
                    {
                        title: 'Step 3',
                        url: '#',
                    },
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
