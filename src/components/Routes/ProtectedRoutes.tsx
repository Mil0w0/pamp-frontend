import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useNavigate } from 'react-router'
import { fetchCurrentUser } from '@/store/user.slice.ts'

interface ProtectedRouteProps {
    allowedRoles: string[]
    children: React.ReactElement
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    children,
}) => {
    const { currentUser, loading } = useSelector(
        (state: RootState) => state.user
    )
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {

        const token = localStorage.getItem('auth_token')
        if (token && !currentUser && !loading) {
            dispatch(fetchCurrentUser(token))
        }
    }, [dispatch, currentUser, loading])

    useEffect(() => {
        console.log('Current User:', currentUser) // <- add this
        console.log('Allowed Roles:', allowedRoles)
        const redirectTimeout = setTimeout(() => {
            if (!loading) {
                if (!currentUser) {
                    navigate('/login', { replace: true })
                } else if (!allowedRoles.includes(currentUser.role)) {
                    navigate('/unauthorized', { replace: true })
                }
            }
        }, 200) // wait 200ms before evaluating redirect conditions because else current user isn't set
        return () => clearTimeout(redirectTimeout)
    }, [currentUser, loading, allowedRoles, navigate])

    if (loading) {
        return 'ah'
    }
    // User is logged in and role allowed
    return children
}

export default ProtectedRoute
