import { configureStore } from '@reduxjs/toolkit'
import projectReducer from './project.slice.ts'
import userReducer from './user.slice.ts'

export const store = configureStore({
    reducer: {
        project: projectReducer,
        user: userReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
