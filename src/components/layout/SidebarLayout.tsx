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
    const { currentUser } = useSelector((state: RootState) => state.user)

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        if (currentUser) {
            dispatch(fetchAllProjects(currentUser?.user_id))
        }
    }, [dispatch, projectId, currentUser])

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
