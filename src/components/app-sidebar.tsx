import * as React from 'react'
import {
    AudioWaveform,
    BookOpen,
    Command,
    Footprints,
    GalleryVerticalEnd,
    Settings2,
    UsersRound,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { ProjectSwitcher } from '@/components/project-switcher.tsx'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar'

// This is sample data.
const data = {
    projects: [
        {
            name: 'Projet 1',
            logo: GalleryVerticalEnd,
            plan: 'PUBLISHED',
        },
        {
            name: 'Projet 2',
            logo: AudioWaveform,
            plan: 'DRAFT',
        },
        {
            name: 'Projet Z',
            logo: Command,
            plan: 'DRAFT',
        },
    ],
    navMain: [
        {
            title: 'Groups settings',
            url: '#',
            icon: UsersRound,
            isActive: true,
            items: [
                {
                    title: 'Composition',
                    url: '#',
                },
                {
                    title: 'Group 1',
                    url: '#',
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
                    url: '#',
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
            title: 'Rapport settings',
            url: '#',
            icon: BookOpen,
            items: [
                {
                    title: 'Introduction',
                    url: '#',
                },
                {
                    title: 'Get Started',
                    url: '#',
                },
                {
                    title: 'Tutorials',
                    url: '#',
                },
                {
                    title: 'Changelog',
                    url: '#',
                },
            ],
        },
        {
            title: 'Settings',
            url: '#',
            icon: Settings2,
            items: [
                {
                    title: 'General',
                    url: '#',
                },
                {
                    title: 'Team',
                    url: '#',
                },
                {
                    title: 'Billing',
                    url: '#',
                },
                {
                    title: 'Limits',
                    url: '#',
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <ProjectSwitcher projects={data.projects} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
