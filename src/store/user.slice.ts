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
export const fetchCurrentUser = createAsyncThunk(
    'user/fetchCurrent',
    async (token: string, { rejectWithValue }) => {
        const res = await authService.getCurrentUser(token)
        if (!res.success) {
            return rejectWithValue(res.message || 'Failed to fetch user')
        }
        console.log('## DEBUG CURRENT USER')
        console.log(res.data)
        // return res.data as User
        //fixme
        return {
            user_id: '26ff5f65-7829-4897-93c1-94d00410c57b',
            email: 'loriane.hilderal@gmail.com',
            first_name: 'Loriane',
            last_name: 'HILDERAL',
            role: 'STUDENT',
            is_active: true,
        }
    }
)

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
