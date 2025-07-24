import * as React from 'react'
import { useEffect } from 'react'
import { ChevronsUpDown } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar.tsx'
import { Project } from '@/components/ManageProjects/types.ts'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

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
    const { currentUser } = useSelector((state: RootState) => state.user)

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
                        {projects.map((proj) => (
                            <DropdownMenuItem
                                key={proj.name}
                                onClick={() => {
                                    setActiveProject(proj)
                                    if (currentUser?.role === 'STUDENT') {
                                        // Find the group the student is in for this project
                                        const studentGroup = proj.groups?.find(
                                            (group) =>
                                                group.studentsIds &&
                                                group.studentsIds
                                                    .split(',')
                                                    .includes(
                                                        currentUser.user_id
                                                    )
                                        )
                                        if (studentGroup) {
                                            navigate(
                                                `/projects/${proj.id}/groups/${studentGroup.id}`
                                            )
                                        } else {
                                            navigate(
                                                `/projects/${proj.id}/groups`
                                            )
                                        }
                                    } else {
                                        navigate(
                                            `/projects/${proj.id}/settings`
                                        )
                                    }
                                }}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    {proj.name[0]}
                                </div>
                                {proj.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
