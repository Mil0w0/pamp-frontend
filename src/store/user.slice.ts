import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '@/services/UserService/types.ts'
import { authService } from '@/services/UserService/auth-api-client.ts'

interface UserState {
    currentUser: User | null
    error: string | null
    loading: boolean
}

const initialState: UserState = {
    currentUser: null,
    error: null,
    loading: false,
}

// Async thunk to fetch current user
export const fetchCurrentUser = createAsyncThunk<
    User,
    string,
    { rejectValue: string }
>('user/fetchCurrent', async (token, { rejectWithValue }) => {
    const res = await authService.getCurrentUser(token)
    if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Failed to fetch user')
    }

    return res.data
})

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setCurrentUser(state, action: PayloadAction<User>) {
            state.currentUser = action.payload
        },
        clearCurrentUser(state) {
            state.currentUser = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false
                // action.payload is now guaranteed to be User
                state.currentUser = action.payload
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload as string
            })
    },
})

export const { setCurrentUser, clearCurrentUser } = userSlice.actions
export default userSlice.reducer
