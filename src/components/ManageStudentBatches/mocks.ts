import { StudentBatch } from '@/components/ManageStudentBatches/types.ts'

export const severalStudentBatches: StudentBatch[] = [
    {
        id: '1',
        state: 'Active',
        createdAt: '15/04/2025',
        tags: 'ESGI',
        name: 'Default Promotion',
        students: [
            {
                user_id: 'first',
                first_name: 'Loriane',
                last_name: 'HILDERAL',
                email: 'loriane@gmail.com',
            },
        ],
    },
    {
        id: '2',
        state: 'INACTIVE',
        createdAt: '15/02/2020',
        tags: 'ESGI, Paris',
        name: 'Promotion A',
        students: [
            {
                user_id: 'first',
                first_name: 'Loriane',
                last_name: 'HILDERAL',
                email: 'loriane@gmail.com',
            },
            {
                user_id: 'first',
                first_name: 'Nino',
                last_name: 'RUTH',
                email: 'nino@gmail.com',
            },
        ],
    },
]

export const oneStudentStudentBatch: StudentBatch = {
    id: 'sjdk',
    state: 'Active',
    createdAt: '15/04/2025',
    tags: 'ESGI',
    name: 'Default Promotion',
    students: [
        {
            user_id: 'first',
            first_name: 'Loriane',
            last_name: 'HILDERAL',
            email: 'loriane@gmail.com',
        },
    ],
}
