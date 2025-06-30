import { useState, useEffect, useCallback } from 'react'
import {
    groupService,
    projectService,
    reportDefinitionService,
} from '@/services/ProjectService/project-api-client'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { ReportDefinition } from '@/services/ProjectService/project-api-client'
import { ReportData } from '../types'

export function useReportData(projectId: string, groupId: string): ReportData & { refreshData: () => Promise<void> } {
    const [project, setProject] = useState<Project | null>(null)
    const [group, setGroup] = useState<ProjectGroup | null>(null)
    const [reportDefinition, setReportDefinition] =
        useState<ReportDefinition | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        if (!projectId || !groupId) return

        setIsLoading(true)

        // Debug logging
        console.log('StudentReportClassic - URL params:', {
            projectId,
            groupId,
        })
        console.log('StudentReportClassic - About to call APIs with:', {
            projectEndpoint: `projects/${projectId}`,
            groupEndpoint: `projectGroups/${groupId}`,
            reportDefEndpoint: `projects/${projectId}/report-definition`,
        })

        try {
            const [projectResponse, groupResponse, reportDefResponse] =
                await Promise.all([
                    projectService.getOneById(projectId),
                    groupService.getOneById(groupId),
                    reportDefinitionService.getReportDefinition(projectId),
                ])

            console.log('API Responses:', {
                projectResponse: {
                    success: projectResponse.success,
                    data: !!projectResponse.data,
                    error: projectResponse.error,
                },
                groupResponse: {
                    success: groupResponse.success,
                    data: !!groupResponse.data,
                    error: groupResponse.error,
                },
                reportDefResponse: {
                    success: reportDefResponse.success,
                    data: !!reportDefResponse.data,
                    error: reportDefResponse.error,
                },
            })

            if (projectResponse.success && projectResponse.data) {
                setProject(projectResponse.data as Project)
                console.log('Project loaded:', projectResponse.data)
            } else {
                console.error('Project loading failed:', projectResponse)
            }

            if (groupResponse.success && groupResponse.data) {
                setGroup(groupResponse.data as ProjectGroup)
                console.log('Group loaded:', groupResponse.data)
            } else {
                console.error('Group loading failed:', groupResponse)
            }

            if (reportDefResponse.success && reportDefResponse.data) {
                const reportDef = reportDefResponse.data
                setReportDefinition(reportDef)
                console.log('Report definition loaded:', reportDef)

                // Check if report is active
                if (!reportDef.isActive) {
                    console.log(
                        'Access denied: Report not active:',
                        reportDef.isActive
                    )
                    setAccessDenied(
                        'This report is not currently active. Please contact your instructor.'
                    )
                    return
                }
            } else {
                // No report definition found
                console.log(
                    'Access denied: No report definition found:',
                    reportDefResponse
                )
                setAccessDenied(
                    'Report is deactivated for this project. Please contact your instructor.'
                )
                return
            }
        } catch (error) {
            console.error(
                'Error fetching project/group/report definition data:',
                error
            )
        } finally {
            setIsLoading(false)
        }
    }, [projectId, groupId])

    const refreshData = useCallback(async () => {
        await fetchData()
    }, [fetchData])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        project,
        group,
        reportDefinition,
        isLoading,
        accessDenied,
        refreshData,
    }
}
