// Client pour le micro service d'auth en rust

import {
    TeacherRegisterDto,
    TeacherRegisterResponse,
} from '@/components/Register/types.ts'
import { UserLoginDto, UserLoginResponse } from '@/components/LogIn/types.ts'
import {
    EditBatchDTO,
    StudentBatch,
} from '@/components/ManageStudentBatches/types.ts'
import {
    oneStudentStudentBatch,
    severalStudentBatches,
} from '@/components/ManageStudentBatches/mocks.ts'

const AUTH_API_URL: string =
    import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000'

const handleApiError = (error: string): TeacherRegisterResponse => {
    console.error('API Erreur:', error)
    return { success: false, error: error }
}
export type ApiErrorMessage = {
    message: string
}
export type BatchServiceResponse = {
    error?: string
    success: boolean
    data?: StudentBatch | StudentBatch[]
}

export const batchService = {
    //todo: put back when connecting to backend
    getOneById: async (id: string): Promise<BatchServiceResponse> => {
        try {
            // const response = await fetch(
            //     `${AUTH_API_URL}/students/batches/${id}`
            // )
            // if (!response.ok) {
            //     const error: ApiErrorMessage = await response.json()
            //     return handleApiError(error.message)
            // } else {
            //     const batch: StudentBatch = await response.json()
            //     return {
            //         success: true,
            //         data: batch,
            //     }
            // }
            return {
                success: true,
                data: oneStudentStudentBatch,
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
    getAll: async (): Promise<BatchServiceResponse> => {
        try {
            // const response = await fetch(
            //     `${AUTH_API_URL}/students/batches`
            // )
            // if (!response.ok) {
            //     const error: ApiErrorMessage = await response.json()
            //     return handleApiError(error.message)
            // } else {
            //     const batches: StudentBatch[] = await response.json()
            //     return {
            //         success: true,
            //         data: batches,
            //     }
            // }
            return {
                success: true,
                data: severalStudentBatches,
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },

    editBatch: async (
        id: string,
        batchEditData: EditBatchDTO
    ): Promise<BatchServiceResponse> => {
        try {
            console.log(batchEditData)
            const response = await fetch(
                `${AUTH_API_URL}/students/batches/${id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batchEditData),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const batch: StudentBatch = await response.json()
                return {
                    success: true,
                    data: batch,
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
}
export const authService = {
    register: async (
        teacherRegisterData: TeacherRegisterDto
    ): Promise<TeacherRegisterResponse> => {
        try {
            const response = await fetch(
                `${AUTH_API_URL}/user-api/auth/register/teacher`,
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
            const response = await fetch(
                `${AUTH_API_URL}/user-api/auth/callback/google`
            )
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
