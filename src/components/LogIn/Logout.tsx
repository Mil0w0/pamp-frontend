import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { clearCurrentUser } from '@/store/user.slice.ts'

export default function Logout() {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        const redirectTimeout = setTimeout(() => {
            localStorage.removeItem('auth_token')
            dispatch(clearCurrentUser())
            toast.success('You have logged out')
            navigate('/')
        }, 200) // wait 200ms before evaluating redirect conditions

        return () => clearTimeout(redirectTimeout)
    }, [navigate, dispatch])

    return null
}
