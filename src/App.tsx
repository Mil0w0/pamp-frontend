import 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect } from 'react'
import { fetchCurrentUser } from './store/user.slice'
import { useNavigate } from 'react-router'

function App() {
    const { currentUser } = useSelector((state: RootState) => state.user)
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            dispatch(fetchCurrentUser(token))
        }
    }, [dispatch])

    useEffect(() => {
        const role = currentUser?.role
        if (role === 'STUDENT') {
            navigate('/student/dashboard', { replace: true })
        }
    }, [currentUser, navigate])

    const role = currentUser?.role

    if (!role) {
        return <div>PAMP HOMEPAGE FOR UNAUTHENTIED USERS</div>
    }
    if (role === 'TEACHER') {
        return <div>PAMP HOMEPAGE FOR TEACHERS</div>
    }
    if (role === 'STUDENT') {
        return <div>Redirecting to dashboard...</div>
    }

    return <div>NOT supported role: {role}, contact the admin</div>
}

export default App
