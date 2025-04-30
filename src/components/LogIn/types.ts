export type UserLoginDto = {
    email: string
    password: string
}

export type UserLoginResponse = {
    success: boolean
    error?: string
}
