import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

export default function AuthCallback() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const token = params.get('token') || 'unknown'
    console.log(params)
    if (token === 'unknown') {
        return 'pas de token'
    } else {
        localStorage.setItem('token', token) //might be a sensible issue
        toast.success('Successfully logged in via SSO')
        navigate('/')
    }
}
