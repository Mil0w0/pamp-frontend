import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useLocation, useNavigate } from 'react-router'
import { fetchCurrentUser } from '@/store/user.slice.ts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
    const location = useLocation()
    const dispatch = useDispatch<AppDispatch>()
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

    // If we already have a user, we don't need to attempt fetch
    const needsFetch = !currentUser && !loading && !hasAttemptedFetch

    useEffect(() => {
        const token = localStorage.getItem('auth_token')

        if (token && needsFetch) {
            console.log('Dispatching fetchCurrentUser')
            setHasAttemptedFetch(true)
            dispatch(fetchCurrentUser(token))
        } else if (!token && !hasAttemptedFetch) {
            console.log('No token, setting hasAttemptedFetch to true')
            setHasAttemptedFetch(true)
        } else if (currentUser && !hasAttemptedFetch) {
            // If we already have a user (from Redux), mark as attempted
            console.log('User already exists in store, marking as attempted')
            setHasAttemptedFetch(true)
        }
    }, [dispatch, currentUser, loading, hasAttemptedFetch, needsFetch])

    useEffect(() => {
        // Only evaluate navigation after we have user data or confirmed no user
        const canEvaluate = currentUser || (!loading && hasAttemptedFetch)

        if (canEvaluate) {
            if (!currentUser) {
                console.log('No user, navigating to login')
                navigate('/login', {
                    state: { from: location.pathname },
                    replace: false,
                })
                return
            }

            if (!allowedRoles.includes(currentUser.role)) {
                console.log('User role not allowed, navigating to home')
                navigate('/', { replace: false })
                return
            }

            console.log('User authorized, rendering children')
        }
    }, [
        currentUser,
        loading,
        allowedRoles,
        navigate,
        hasAttemptedFetch,
        location.pathname,
    ])

    // Show loading only if we're actually loading or need to fetch
    if (loading || needsFetch) {
        console.log('Showing loading state')
        return <LoadingSpinner />
    }

    // If no user and we've attempted fetch, navigation will handle redirect
    if (!currentUser) {
        console.log('No user, showing redirecting state')
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-sm text-muted-foreground">
                        Redirecting...
                    </p>
                </div>
            </div>
        )
    }

    // Check if user has the required role
    if (!allowedRoles.includes(currentUser.role)) {
        console.log('User not authorized')
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-destructive">
                        Unauthorized Access
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        You don't have permission to access this page.
                    </p>
                </div>
            </div>
        )
    }

    console.log('Rendering protected content')
    // User is logged in and has the required role
    return children
}

export default ProtectedRoute
