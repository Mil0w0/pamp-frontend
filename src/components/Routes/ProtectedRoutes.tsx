import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router'
import { AppDispatch, RootState } from '@/store'
import { fetchCurrentUser } from '@/store/user.slice'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles = [],
}) => {
    const { currentUser, loading } = useSelector(
        (state: RootState) => state.user
    )
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token && !currentUser) {
            dispatch(fetchCurrentUser(token))
        }
    }, [dispatch, currentUser])

    // Si pas de token, rediriger vers login
    const token = localStorage.getItem('auth_token')
    if (!token) {
        return <Navigate to="/login" replace />
    }

    // Si en cours de chargement
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        )
    }

    // Si on a un token mais pas encore d'utilisateur, continuer à charger
    if (token && !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        )
    }

    // Vérifier si l'utilisateur a le rôle requis
    if (
        allowedRoles.length > 0 &&
        currentUser &&
        !allowedRoles.includes(currentUser.role)
    ) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute
