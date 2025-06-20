import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchCurrentUser } from '@/store/user.slice.ts'
import { AppDispatch } from '@/store'

export default function AuthCallback() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        const token = params.get('token')
        const error = params.get('error')

        if (error) {
            toast.error(error)
        } else if (token) {
            localStorage.setItem('auth_token', token)
            dispatch(fetchCurrentUser(token))
            toast.success('Successfully logged in via SSO')
            navigate('/')
        }
    }, [params, navigate])

    return null
}
