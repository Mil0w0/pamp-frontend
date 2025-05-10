export type StudentBatches = {
    id: string
    state: string
    name: string
    students: number
    createdAt: Date
    tags: string
}[]

export type StudentBatch = {
    id: string
    state: string
    name: string
    students: Student[]
    createdAt: string
    tags: string
}

export type Student = {
    id: string
    email: string
    first_name: string
    last_name: string
}

export type EditBatchDTO = {
    state: string
    name: string
    students: Student[]
    createdAt: string
    tags: string
}
