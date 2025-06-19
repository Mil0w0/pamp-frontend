import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar.tsx'
import { Project } from '@/components/ManageProjects/types.ts'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {useNavigate} from "react-router";

export function ProjectSwitcher({
    projects,
    currentProject,
}: {
    projects: Project[]
    currentProject: Project | null
}) {
    const { isMobile } = useSidebar()
    const [project, setActiveProject] = React.useState(currentProject)
    const navigate = useNavigate()

    useEffect(() => {
        setActiveProject(currentProject)
    }, [currentProject])
    if (!project) {
        return <Skeleton />
    }
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                {project.name[0]}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {project.name}
                                </span>
                                <span className="truncate text-xs">
                                    {project.isPublished
                                        ? 'PUBLISHED'
                                        : 'DRAFT'}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            All projects
                        </DropdownMenuLabel>
                        {projects.map((project) => (
                            <DropdownMenuItem
                                key={project.name}
                                onClick={() => {
                                    setActiveProject(project)
                                    navigate('/projects/' + project.id)
                                }}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    {project.name[0]}
                                </div>
                                {project.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2">
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                <Plus className="size-4" />
                            </div>
                            <div className="text-muted-foreground font-medium">
                                Add project
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
