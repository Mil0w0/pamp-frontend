import { useEffect, useState } from 'react'
import { submissionService } from '@/services/SubmissionService/submission-api-client'
import {
    groupService,
    stepsService,
} from '@/services/ProjectService/project-api-client'
import { authService } from '@/services/UserService/auth-api-client'
import { DetailedSimilarityResponse } from '../types'
import { User } from '@/services/UserService/types'

export interface SubmissionContext {
    submissionId: string
    projectId?: string
    groupId?: string
    stepId?: string
    stepName?: string
    groupName?: string
    groupMembers?: User[]
    uploadDateTime?: string
}

export interface ComparisonContext {
    submission1: SubmissionContext
    submission2: SubmissionContext
    stepName?: string
    isLoading: boolean
    error: string | null
}

interface UseComparisonContextProps {
    detailedSimilarity: DetailedSimilarityResponse | null
}

export const useComparisonContext = ({
    detailedSimilarity,
}: UseComparisonContextProps) => {
    const [comparisonContext, setComparisonContext] =
        useState<ComparisonContext | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchComparisonContext = async () => {
            if (!detailedSimilarity) {
                setComparisonContext(null)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                const { submission1, submission2 } =
                    detailedSimilarity.submissions

                console.log('Fetching context for submissions:', {
                    sub1: submission1.id,
                    sub2: submission2.id,
                })

                // Fetch detailed submission data for both submissions
                const [sub1Response, sub2Response] = await Promise.all([
                    submissionService.getOneById(submission1.id),
                    submissionService.getOneById(submission2.id),
                ])

                if (!sub1Response.success || !sub2Response.success) {
                    throw new Error('Failed to fetch submission details')
                }

                const sub1Data = sub1Response.data
                const sub2Data = sub2Response.data

                if (!sub1Data || !sub2Data) {
                    throw new Error('No submission data available')
                }

                // Handle different response structures and extract submission data
                let sub1Submission: any, sub2Submission: any

                // Type guard for CreatedSubmissionResponse
                if (
                    sub1Data &&
                    typeof sub1Data === 'object' &&
                    'data' in sub1Data
                ) {
                    sub1Submission = (sub1Data as any).data
                } else {
                    sub1Submission = sub1Data
                }

                if (
                    sub2Data &&
                    typeof sub2Data === 'object' &&
                    'data' in sub2Data
                ) {
                    sub2Submission = (sub2Data as any).data
                } else {
                    sub2Submission = sub2Data
                }

                // Extract project, group, and step IDs with safety checks
                const projectId1 = sub1Submission?.project_uuid || ''
                const groupId1 = sub1Submission?.group_uuid || ''
                const stepId1 = sub1Submission?.project_step_uuid || ''

                const projectId2 = sub2Submission?.project_uuid || ''
                const groupId2 = sub2Submission?.group_uuid || ''
                const stepId2 = sub2Submission?.project_step_uuid || ''

                console.log('Extracted IDs:', {
                    sub1: { projectId1, groupId1, stepId1 },
                    sub2: { projectId2, groupId2, stepId2 },
                })

                // Fetch step information (assuming same step for both submissions)
                const stepResponse = await stepsService.getOneById(
                    stepId1,
                    projectId1
                )
                const stepName = stepResponse.success
                    ? stepResponse.data?.name
                    : 'Unknown Step'

                // Fetch group information for both groups
                const [group1Response, group2Response] = await Promise.all([
                    groupService.getOneById(groupId1),
                    groupService.getOneById(groupId2),
                ])

                // Handle group data (might be single object or array)
                const group1Data =
                    group1Response.success && group1Response.data
                        ? Array.isArray(group1Response.data)
                            ? group1Response.data[0]
                            : group1Response.data
                        : null
                const group2Data =
                    group2Response.success && group2Response.data
                        ? Array.isArray(group2Response.data)
                            ? group2Response.data[0]
                            : group2Response.data
                        : null

                // Get all unique student IDs from both groups (parse studentsIds string)
                const group1StudentIds = group1Data?.studentsIds
                    ? group1Data.studentsIds
                          .split(',')
                          .filter((id) => id.trim())
                    : []
                const group2StudentIds = group2Data?.studentsIds
                    ? group2Data.studentsIds
                          .split(',')
                          .filter((id) => id.trim())
                    : []
                const allStudentIds = [...group1StudentIds, ...group2StudentIds]
                const uniqueStudentIds = [...new Set(allStudentIds)]

                // Fetch all students data
                let allStudents: User[] = []
                if (uniqueStudentIds.length > 0) {
                    const studentsResponse = await authService.getStudents()
                    if (studentsResponse.success && studentsResponse.data) {
                        allStudents = studentsResponse.data as User[]
                    }
                }

                // Filter students for each group
                const group1Members = allStudents.filter((student) =>
                    group1StudentIds.includes(student.user_id)
                )
                const group2Members = allStudents.filter((student) =>
                    group2StudentIds.includes(student.user_id)
                )

                console.log('Fetched context data:', {
                    stepName,
                    group1: group1Data?.name,
                    group2: group2Data?.name,
                    group1Members: group1Members.length,
                    group2Members: group2Members.length,
                })

                const context: ComparisonContext = {
                    submission1: {
                        submissionId: submission1.id,
                        projectId: projectId1,
                        groupId: groupId1,
                        stepId: stepId1,
                        stepName,
                        groupName: group1Data?.name || 'Unknown Group',
                        groupMembers: group1Members,
                        uploadDateTime: submission1.upload_date_time,
                    },
                    submission2: {
                        submissionId: submission2.id,
                        projectId: projectId2,
                        groupId: groupId2,
                        stepId: stepId2,
                        stepName,
                        groupName: group2Data?.name || 'Unknown Group',
                        groupMembers: group2Members,
                        uploadDateTime: submission2.upload_date_time,
                    },
                    stepName,
                    isLoading: false,
                    error: null,
                }

                setComparisonContext(context)
            } catch (err) {
                console.error('Error fetching comparison context:', err)
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch context'
                setError(errorMessage)
                setComparisonContext(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchComparisonContext()
    }, [detailedSimilarity])

    return {
        comparisonContext,
        isLoading,
        error,
    }
}
