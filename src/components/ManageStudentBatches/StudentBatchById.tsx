import { useParams } from 'react-router'
import { Error404 } from '@/components/Error/Error404.tsx'

export default function StudentBatchById() {
    const params = useParams()
    const studentBatchId = params.id || 'unknown'
    if (studentBatchId === 'unknown') {
        return <Error404 />
    }
    return <>Student batch: {studentBatchId}</>
}
