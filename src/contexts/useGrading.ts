import { useContext } from 'react'
import { GradingContext } from './GradingContext'

export const useGrading = () => {
    const context = useContext(GradingContext)
    if (!context) {
        throw new Error('useGrading must be used within GradingProvider')
    }
    return context
}
