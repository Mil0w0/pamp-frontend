// Client pour le micro service d'auth en rust

import {
    TeacherRegisterDto,
    TeacherRegisterResponse,
} from '@/components/Register/types.ts'
import { UserLoginDto, UserLoginResponse } from '@/components/LogIn/types.ts'

const AUTH_API_URL: string =
    import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000'

const handleApiError = (error: string): TeacherRegisterResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
export type ApiErrorMessage = {
    message: string
}

export const authService = {
    register: async (
        teacherRegisterData: TeacherRegisterDto
    ): Promise<TeacherRegisterResponse> => {
        try {
            const response = await fetch(
                `${AUTH_API_URL}/auth/register/teacher`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(teacherRegisterData),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            return { success: response.ok }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    login: async (loginData: UserLoginDto): Promise<UserLoginResponse> => {
        console.log(loginData)
        return { success: false, error: 'Not implemented yet' }
    },
    ssoLogin: async () => {
        try {
            const response = await fetch(`${AUTH_API_URL}/auth/callback/google`)
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
}
