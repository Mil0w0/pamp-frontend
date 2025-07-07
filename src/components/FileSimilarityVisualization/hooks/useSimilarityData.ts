import { useState, useEffect } from 'react'
import { similarityService } from '@/services/SimilarityService/similarity-api-client'
import { SimilarityResponse } from '../types'

export const useSimilarityData = () => {
    const [data, setData] = useState<SimilarityResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Starting data fetch...')
                setLoading(true)
                setError(null)

                const result = await similarityService.getSimilarityData()

                if (result.success && result.data) {
                    console.log('Data fetched successfully:', {
                        timestamp: result.data.timestamp,
                        layout_used: result.data.layout_used,
                        total_file_pairs: result.data.file_pairs?.length,
                        total_file_pairs_with_similarity:
                            result.data.total_file_pairs_with_similarity,
                    })
                    setData(result.data)
                } else {
                    const errorMessage =
                        result.error || 'Failed to fetch similarity data'
                    console.error('API Error:', errorMessage)
                    setError(errorMessage)
                }
            } catch (err) {
                console.error('Unexpected error in useSimilarityData:', err)
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An unexpected error occurred'
                setError(errorMessage)
            } finally {
                console.log('Setting loading to false')
                setLoading(false)
            }
        }

        console.log('useSimilarityData effect triggered, calling fetchData')
        fetchData()
    }, [])

    return {
        data,
        loading,
        error,
        refetch: () => {
            setLoading(true)
            setError(null)
            // The effect will run again and fetch data
        },
    }
}
