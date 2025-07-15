import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { User } from '@/services/UserService/types'

interface ProjectContextType {
    projectId: string | null
    currentUser: User | null
    userRole: 'teacher' | 'student' | null
    isLoading: boolean
    error: string | null
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

interface ProjectProviderProps {
    children: ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
    children,
}) => {
    const { projectId } = useParams<{ projectId: string }>()
    const { currentUser, loading } = useSelector(
        (state: { user: { currentUser: User | null; loading: boolean } }) =>
            state.user
    )
    const [error, setError] = useState<string | null>(null)

    // Determine user role from current user
    const userRole =
        currentUser?.role === 'TEACHER'
            ? 'teacher'
            : currentUser?.role === 'STUDENT'
              ? 'student'
              : null

    useEffect(() => {
        if (!projectId) {
            setError('Project ID is required')
        } else {
            setError(null)
        }
    }, [projectId])

    const value: ProjectContextType = {
        projectId: projectId || null,
        currentUser,
        userRole,
        isLoading: loading,
        error,
    }

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
