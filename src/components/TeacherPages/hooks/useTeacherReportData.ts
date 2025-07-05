import { useState, useEffect } from 'react'
import {
    groupService,
    projectService,
    reportDefinitionService,
} from '@/services/ProjectService/project-api-client'
import { Project } from '@/components/ManageProjects/types'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { TeacherReportData } from '../types'
import { ReportDefinition } from '@/services/ProjectService/types.ts'

export function useTeacherReportData(
    projectId: string,
    groupId: string
): TeacherReportData {
    const [project, setProject] = useState<Project | null>(null)
    const [group, setGroup] = useState<ProjectGroup | null>(null)
    const [reportDefinition, setReportDefinition] =
        useState<ReportDefinition | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !groupId) return

            setIsLoading(true)

            try {
                const [projectResponse, groupResponse, reportDefResponse] =
                    await Promise.all([
                        projectService.getOneById(projectId),
                        groupService.getOneById(groupId),
                        reportDefinitionService.getReportDefinition(projectId),
                    ])

                if (projectResponse.success && projectResponse.data) {
                    setProject(projectResponse.data as Project)
                }

                if (groupResponse.success && groupResponse.data) {
                    setGroup(groupResponse.data as ProjectGroup)
                }

                if (reportDefResponse.success && reportDefResponse.data) {
                    setReportDefinition(reportDefResponse.data)
                }
            } catch (error) {
                console.error('Error fetching project/group data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [projectId, groupId])

    return {
        project,
        group,
        reportDefinition,
        isLoading,
    }
}
