export type TeacherRegisterDto = {
    email: string
    password: string
    first_name: string
    last_name: string
}

export type TeacherRegisterResponse = {
    success: boolean
    error?: string
}
