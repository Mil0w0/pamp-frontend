import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Project } from '@/components/ManageProjects/types.ts'
import { projectService } from '@/services/ProjectService/project-api-client.ts'

interface ProjectState {
    currentProject: Project | null
    allProjects: Project[]
    error: Error | null
}

const initialState: ProjectState = {
    currentProject: null,
    allProjects: [],
    error: null,
}

// Async thunk to load project by ID
export const fetchProjectById = createAsyncThunk(
    'project/fetchById',
    async (id: string) => {
        const res = await projectService.getOneById(id)
        if (!res.success) {
            //fixme : this doesn't work as expected
            initialState.error = {
                name: 'error',
                message: res.error || 'Error',
            }
        }
        const project = res?.data as Project
        return {
            ...project,
        }
    }
)

// Async thunk to load all projects
export const fetchAllProjects = createAsyncThunk(
    'project/fetchAll',
    async () => {
        const res = await projectService.getAll()
        return res?.data as Project[]
    }
)

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setCurrentProject(state, action: PayloadAction<Project>) {
            state.currentProject = action.payload
        },
        updateProjectInList(state, action: PayloadAction<Project>) {
            const updated = action.payload
            state.allProjects = state.allProjects.map((p) =>
                p.id === updated.id ? updated : p
            )
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchProjectById.fulfilled, (state, action) => {
            state.currentProject = action.payload
        })
        builder.addCase(fetchAllProjects.fulfilled, (state, action) => {
            state.allProjects = action.payload
        })
    },
})

export const { setCurrentProject, updateProjectInList } = projectSlice.actions
export default projectSlice.reducer
