import 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect } from 'react'
import { fetchCurrentUser } from './store/user.slice'
import HomePage from '@/HomePage.tsx'

function App() {
    const { currentUser } = useSelector((state: RootState) => state.user)
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            dispatch(fetchCurrentUser(token))
        }
    }, [dispatch])

    const role = currentUser?.role

    if (!role) {
        return <HomePage isTeacher={-1} />
    }
    if (role === 'TEACHER') {
        return <HomePage isTeacher={1} />
    }
    if (role === 'STUDENT') {
        return <HomePage isTeacher={0} />
    }
    return <div>NOT supported role: {role}, contact the admin</div>
}

export default App
