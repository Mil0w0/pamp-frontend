import React, { useEffect, useState } from 'react'
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
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token && !currentUser && !loading && !hasAttemptedFetch) {
            setHasAttemptedFetch(true)
            dispatch(fetchCurrentUser(token))
        } else if (!token && !hasAttemptedFetch) {
            // No token, no need to fetch
            setHasAttemptedFetch(true)
        }
    }, [dispatch, currentUser, loading, hasAttemptedFetch])

    useEffect(() => {
        console.log('Current User:', currentUser) // <- add this
        console.log('Allowed Roles:', allowedRoles)
        // Only evaluate navigation after we've attempted to fetch user data and not currently loading
        if (hasAttemptedFetch && !loading) {
            if (!currentUser) {
                navigate('/login', { replace: true })
            } else if (!allowedRoles.includes(currentUser.role)) {
                navigate('/unauthorized', { replace: true })
            }
        }
    }, [currentUser, loading, allowedRoles, navigate, hasAttemptedFetch])

    // Show loading while we're fetching user data or haven't attempted fetch yet
    if (loading || !hasAttemptedFetch) {
        return null
    }
    // User is logged in and role allowed
    return children
}

export default ProtectedRoute
