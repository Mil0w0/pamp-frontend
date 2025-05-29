import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'

export default function Logout() {
    const navigate = useNavigate()

    useEffect(() => {
        localStorage.removeItem('auth_token')
        toast.success('You have logged out')
        navigate('/')
    }, [navigate])

    return null
}
