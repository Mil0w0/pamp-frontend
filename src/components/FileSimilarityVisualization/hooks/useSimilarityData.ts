import { useEffect, useState } from 'react'
import { submissionService } from '@/services/SubmissionService/submission-api-client'
import {
    DetailedSimilarityResponse,
    SimilarityResponse,
    SubmissionSimilarity,
} from '../types'

interface UseSimilarityDataProps {
    submissionId: string | undefined
    selectedSimilarityId?: string
}

export const useSimilarityData = ({
    submissionId,
    selectedSimilarityId,
}: UseSimilarityDataProps) => {
    const [data, setData] = useState<SimilarityResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [similarities, setSimilarities] = useState<SubmissionSimilarity[]>([])
    const [currentSimilarityId, setCurrentSimilarityId] = useState<
        string | null
    >(null)

    // Transform detailed similarity response to the expected format
    const transformDetailedData = (
        detailedData: DetailedSimilarityResponse,
        submissionId: string,
        similarities: SubmissionSimilarity[]
    ): SimilarityResponse => {
        // Handle case where analysis is still processing (visualization_data is null)
        const visualizationData =
            detailedData.detailed_results?.visualization_data || []

        return {
            timestamp: detailedData.analysis_metadata.created_at,
            total_file_pairs_with_similarity: visualizationData.length,
            layout_used: 'elk_layered',
            file_pairs: visualizationData,
            submission_info: {
                submission_id: submissionId,
                similarities: similarities,
                selected_similarity_id: detailedData.similarity_id,
            },
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!submissionId) {
                console.log('No submission ID provided')
                setLoading(false)
                setError('No submission ID provided')
                return
            }

            try {
                console.log(
                    'Starting similarity data fetch for submission:',
                    submissionId
                )
                setLoading(true)
                setError(null)

                // Step 1: Get list of similarities for the submission
                console.log('Fetching similarities list...')
                const similaritiesResult =
                    await submissionService.getSimilarities(submissionId)

                if (!similaritiesResult.success || !similaritiesResult.data) {
                    const errorMessage =
                        similaritiesResult.error ||
                        'Failed to fetch similarities'
                    console.error('Similarities API Error:', errorMessage)
                    setError(errorMessage)
                    return
                }

                const similaritiesData = similaritiesResult.data
                setSimilarities(similaritiesData.similarities)

                console.log('Similarities fetched successfully:', {
                    total_comparisons: similaritiesData.total_comparisons,
                    similarities_count: similaritiesData.similarities.length,
                })

                // If no similarities found, set empty state
                if (
                    !similaritiesData.similarities ||
                    similaritiesData.similarities.length === 0
                ) {
                    console.log('No similarities found for this submission')
                    setData({
                        timestamp: new Date().toISOString(),
                        total_file_pairs_with_similarity: 0,
                        layout_used: 'elk_layered',
                        file_pairs: [],
                        submission_info: {
                            submission_id: submissionId,
                            similarities: [],
                        },
                    })
                    return
                }

                // Step 2: Select which similarity to show (use selectedSimilarityId or first one)
                const targetSimilarity = selectedSimilarityId
                    ? similaritiesData.similarities.find(
                          (s) => s.similarity_id === selectedSimilarityId
                      )
                    : similaritiesData.similarities[0]

                if (!targetSimilarity) {
                    console.error('Target similarity not found')
                    setError('Selected similarity not found')
                    return
                }

                setCurrentSimilarityId(targetSimilarity.similarity_id)

                // Check if the similarity is still processing BEFORE trying to fetch detailed data
                if (targetSimilarity.status === 'processing') {
                    setError(
                        'Analysis is still processing. Please wait and try again in a few moments.'
                    )
                    return
                }

                // Step 3: Get detailed similarity data for visualization
                console.log(
                    'Fetching detailed similarity data for:',
                    targetSimilarity.similarity_id
                )
                const detailedResult =
                    await submissionService.getDetailedSimilarity(
                        targetSimilarity.similarity_id
                    )

                if (!detailedResult.success || !detailedResult.data) {
                    const errorMessage =
                        detailedResult.error ||
                        'Failed to fetch detailed similarity data'
                    console.error(
                        'Detailed Similarity API Error:',
                        errorMessage
                    )
                    setError(errorMessage)
                    return
                }

                const detailedData = detailedResult.data

                console.log('Detailed similarity data fetched successfully:', {
                    similarity_id: detailedData.similarity_id,
                    visualization_data_count:
                        detailedData.detailed_results?.visualization_data
                            ?.length || 0,
                    status: detailedData.analysis_metadata.status,
                })

                // Check if analysis failed
                if (detailedData.analysis_metadata.error_message) {
                    setError(
                        `Analysis failed: ${detailedData.analysis_metadata.error_message}`
                    )
                    return
                }

                // Check if no similarities found (prioritize this over processing status)
                if (
                    !detailedData.detailed_results?.visualization_data ||
                    detailedData.detailed_results.visualization_data.length ===
                        0
                ) {
                    setError(
                        'No significant similarities found between these submissions.'
                    )
                    return
                }

                // Check if analysis is still processing (only if we have visualization_data but it's somehow still processing)
                if (detailedData.analysis_metadata.status === 'processing') {
                    setError(
                        'Analysis is still processing. Please wait and try again in a few moments.'
                    )
                    return
                }

                // Step 4: Transform and set the data
                const transformedData = transformDetailedData(
                    detailedData,
                    submissionId,
                    similaritiesData.similarities
                )

                setData(transformedData)
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
    }, [submissionId, selectedSimilarityId])

    // Function to switch to a different similarity
    const switchToSimilarity = async (similarityId: string) => {
        if (!submissionId || !similarities.length) {
            console.error('Cannot switch similarity: missing data')
            return
        }

        const targetSimilarity = similarities.find(
            (s) => s.similarity_id === similarityId
        )
        if (!targetSimilarity) {
            console.error('Target similarity not found:', similarityId)
            return
        }

        try {
            setLoading(true)
            setError(null)

            console.log('Switching to similarity:', similarityId)

            // Check if the target similarity is still processing
            if (targetSimilarity.status === 'processing') {
                setError(
                    'Analysis is still processing. Please wait and try again in a few moments.'
                )
                return
            }
            const detailedResult =
                await submissionService.getDetailedSimilarity(similarityId)

            if (!detailedResult.success || !detailedResult.data) {
                const errorMessage =
                    detailedResult.error ||
                    'Failed to fetch detailed similarity data'
                console.error('Switch similarity error:', errorMessage)
                setError(errorMessage)
                return
            }

            const detailedData = detailedResult.data

            // Check if analysis failed
            if (detailedData.analysis_metadata.error_message) {
                setError(
                    `Analysis failed: ${detailedData.analysis_metadata.error_message}`
                )
                return
            }

            // Check if no similarities found (prioritize this over processing status)
            if (
                !detailedData.detailed_results?.visualization_data ||
                detailedData.detailed_results.visualization_data.length === 0
            ) {
                setError(
                    'No significant similarities found between these submissions.'
                )
                return
            }

            // Check if analysis is still processing (only if we have visualization_data but it's somehow still processing)
            if (detailedData.analysis_metadata.status === 'processing') {
                setError(
                    'Analysis is still processing. Please wait and try again in a few moments.'
                )
                return
            }

            const transformedData = transformDetailedData(
                detailedData,
                submissionId,
                similarities
            )

            setData(transformedData)
            setCurrentSimilarityId(similarityId)
        } catch (err) {
            console.error('Error switching similarity:', err)
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to switch similarity'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return {
        data,
        loading,
        error,
        similarities,
        currentSimilarityId,
        switchToSimilarity,
        refetch: () => {
            setLoading(true)
            setError(null)
            // The effect will run again and fetch data
        },
    }
}
