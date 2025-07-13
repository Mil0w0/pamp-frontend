import React from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { GradingSystemDemo } from '@/components/GradingSystem'

const ProjectGradingPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>()
    const { currentUser } = useSelector((state: RootState) => state.user)

    if (!projectId) {
        return <div>Projet non trouvé</div>
    }

    const userRole = currentUser?.role === 'STUDENT' ? 'student' : 'teacher'

    return (
        <div className="container mx-auto p-6">
            <GradingSystemDemo projectId={projectId} userRole={userRole} />
        </div>
    )
}

export default ProjectGradingPage
