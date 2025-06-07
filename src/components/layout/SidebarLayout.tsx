import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/Navbar/app-sidebar.tsx'
import { Outlet, useNavigate, useParams } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice.ts'

export default function SidebarLayout() {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject, allProjects, error } = useSelector(
        (state: RootState) => state.project
    )

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        dispatch(fetchAllProjects())

        console.log(error)
    }, [dispatch, projectId])

    console.log(error)
    if (error !== null) {
        navigate('/error')
    }
    return (
        <SidebarProvider>
            <AppSidebar
                allProjects={allProjects}
                currentProject={currentProject}
            />
            <main className="w-full">
                <SidebarTrigger />
                <Outlet />
            </main>
        </SidebarProvider>
    )
}
