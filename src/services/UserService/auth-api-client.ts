// Client pour le micro service d'auth/users en rust

import {
    TeacherRegisterDto,
    TeacherRegisterResponse,
} from '@/components/Register/types.ts'
import { UserLoginDto, UserLoginResponse } from '@/components/LogIn/types.ts'
import {
    EditBatchDTO,
    Student,
    StudentBatch,
} from '@/components/ManageStudentBatches/types.ts'
import { User } from '@/services/UserService/types.ts'

declare global {
    interface Window {
        RUNTIME_CONFIG?: {
            AUTH_API_URL?: string
        }
    }
}

export const AUTH_API_URL: string =
    window.RUNTIME_CONFIG?.AUTH_API_URL ||
    import.meta.env.VITE_AUTH_API_URL ||
    'http://localhost:3000'

export const PROJECT_API_URL: string =
    import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:3000'

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
    data?: StudentBatch | StudentBatch[] | Student[]
}

export type CreateBatchDTO = {
    name: string
}

export const batchService = {
    getOneById: async (id: string): Promise<BatchServiceResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/student-batches/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const batch: StudentBatch = await response.json()
                console.log(batch)
                return {
                    success: true,
                    data: batch,
                }
            }
            // return {
            //     success: true,
            //     data: oneStudentStudentBatch,
            // }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
    getAll: async (): Promise<BatchServiceResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/student-batches`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const batches: StudentBatch[] = await response.json()
                return {
                    success: true,
                    data: batches,
                }
            }
            // return {
            //     success: true,
            //     data: severalStudentBatches,
            // }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
    editBatch: async (
        id: string,
        batchEditData: EditBatchDTO
    ): Promise<BatchServiceResponse> => {
        console.log(batchEditData)
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/student-batches/${id}`,
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

    createBatch: async (
        createBatchData: CreateBatchDTO
    ): Promise<BatchServiceResponse> => {
        try {
            const response = await fetch(`${PROJECT_API_URL}/student-batches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify(createBatchData),
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const batch: StudentBatch = await response.json()
            return { success: response.ok, data: batch }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
    deleteBatch: async (id: string): Promise<BatchServiceResponse> => {
        try {
            const response = await fetch(
                `${PROJECT_API_URL}/student-batches/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    },
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
                `${AUTH_API_URL}/register/teacher`,
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
    getStudents: async (): Promise<BatchServiceResponse> => {
        try {
            const response = await fetch(`${AUTH_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            } else {
                const users: User[] = await response.json()
                const students = users.filter(
                    (user) => user.role.toLowerCase() === 'student'
                )
                return {
                    success: true,
                    data: students as Student[],
                }
            }
        } catch (error) {
            const err = error as ApiErrorMessage
            return handleApiError(err.message)
        }
    },
    login: async (loginData: UserLoginDto): Promise<UserLoginResponse> => {
        try {
            const response = await fetch(
                `${AUTH_API_URL}/login/teacher`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData),
                }
            )
            if (!response.ok) {
                const error: ApiErrorMessage = await response.json()
                return handleApiError(error.message)
            }
            const data: { token: string } = await response.json()
            //TODO: get a secure cookie instead of local storage late
            localStorage.setItem('auth_token', data.token)
            return { success: response.ok, token: data.token }
        } catch (error) {
            const err = error as Error
            return handleApiError(err.message)
        }
    },
}
