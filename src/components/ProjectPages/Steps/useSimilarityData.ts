import { useCallback, useEffect, useState } from 'react'
import { submissionService } from '@/services/SubmissionService/submission-api-client'
import { groupService } from '@/services/ProjectService/project-api-client'
import { SubmissionSimilarity } from '@/components/FileSimilarityVisualization/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { SubmissionResponse } from '@/services/SubmissionService/types'

export interface UseSimilarityDataReturn {
    similarities: SubmissionSimilarity[]
    loading: boolean
    error: string | null
    highestSimilarityGroup: ProjectGroup | null
    similarityGroups: Map<string, ProjectGroup>
    refetch: () => void
}

// Custom hook for fetching and managing similarity data
export const useSimilarityData = (
    submissionId: string | undefined
): UseSimilarityDataReturn => {
    const [similarities, setSimilarities] = useState<SubmissionSimilarity[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState<number>(0)
    const [highestSimilarityGroup, setHighestSimilarityGroup] =
        useState<ProjectGroup | null>(null)
    const [similarityGroups, setSimilarityGroups] = useState<
        Map<string, ProjectGroup>
    >(new Map())
    const [loadingGroup, setLoadingGroup] = useState<boolean>(false)

    const fetchGroupForSubmission = useCallback(
        async (comparedSubmissionId: string): Promise<ProjectGroup | null> => {
            try {
                // First get the submission to find the group_uuid
                const submissionResult =
                    await submissionService.getOneById(comparedSubmissionId)
                if (submissionResult.success && submissionResult.data) {
                    // The API returns a nested structure, need to access the actual submission data
                    const submissionData = submissionResult.data as any
                    const submission =
                        submissionData.data ||
                        (submissionData as SubmissionResponse)

                    if (submission.group_uuid) {
                        // Then get the group information
                        const groupResult = await groupService.getOneById(
                            submission.group_uuid
                        )
                        if (groupResult.success && groupResult.data) {
                            return groupResult.data as ProjectGroup
                        }
                    }
                }
                return null
            } catch (err) {
                console.error(
                    'Error fetching group for submission:',
                    comparedSubmissionId,
                    err
                )
                return null
            }
        },
        []
    )

    const fetchAllSimilarityGroups = useCallback(
        async (similaritiesData: SubmissionSimilarity[]) => {
            try {
                setLoadingGroup(true)
                const groupMap = new Map<string, ProjectGroup>()

                // Fetch groups for all similarities
                for (const similarity of similaritiesData) {
                    const group = await fetchGroupForSubmission(
                        similarity.compared_submission_id
                    )
                    if (group) {
                        groupMap.set(similarity.similarity_id, group)
                    }
                }

                setSimilarityGroups(groupMap)

                // Set the highest similarity group
                if (similaritiesData.length > 0) {
                    const highestSimilarity = similaritiesData.reduce(
                        (prev, current) =>
                            current.overall_similarity > prev.overall_similarity
                                ? current
                                : prev
                    )
                    const highestGroup = groupMap.get(
                        highestSimilarity.similarity_id
                    )
                    if (highestGroup) {
                        setHighestSimilarityGroup(highestGroup)
                    }
                }
            } catch (err) {
                console.error('Error fetching similarity groups:', err)
            } finally {
                setLoadingGroup(false)
            }
        },
        [fetchGroupForSubmission]
    )

    const fetchSimilarities = useCallback(async () => {
        if (!submissionId) return

        setLoading(true)
        setError(null)

        try {
            const result = await submissionService.getSimilarities(submissionId)

            if (result.success && result.data) {
                const similaritiesData = result.data.similarities || []
                setSimilarities(similaritiesData)
                setRetryCount(0) // Reset retry count on success

                // Fetch groups for all similarities
                if (similaritiesData.length > 0) {
                    await fetchAllSimilarityGroups(similaritiesData)
                }
            } else {
                // If we get a 404 or "not found" type error, this might mean similarities are still being calculated
                if (
                    result.error?.includes('404') ||
                    result.error?.includes('not found')
                ) {
                    setError('calculating')
                    // Increment retry count and retry up to 10 times (50 seconds total)
                    if (retryCount < 10) {
                        setTimeout(() => {
                            setRetryCount((prev) => prev + 1)
                        }, 5000)
                    } else {
                        setError('Similarity calculation timed out')
                    }
                } else {
                    setError(result.error || 'Failed to fetch similarities')
                }
            }
        } catch (err) {
            setError('Failed to fetch similarities')
            console.error('Error fetching similarities:', err)
        } finally {
            setLoading(false)
        }
    }, [submissionId, retryCount, fetchAllSimilarityGroups])

    useEffect(() => {
        fetchSimilarities()
    }, [fetchSimilarities])

    return {
        similarities,
        loading: loading || loadingGroup,
        error,
        highestSimilarityGroup,
        similarityGroups,
        refetch: fetchSimilarities,
    }
}
