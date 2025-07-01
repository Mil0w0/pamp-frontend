import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router'
import { groupService } from '@/services/ProjectService/project-api-client'
import { ProjectGroup } from '@/components/ProjectPages/types'
import { BookOpen, Calendar, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentDashboard() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState<ProjectGroup[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMyGroups()
    }, [])

    const loadMyGroups = async () => {
        try {
            const response = await groupService.getMyGroups()
            if (response.success && response.data) {
                console.log(response.data)
                setGroups(
                    Array.isArray(response.data)
                        ? response.data
                        : [response.data]
                )
            } else {
                toast.error(response.error || 'Failed to load groups')
            }
        } catch (error) {
            console.error('Error loading groups:', error)
            toast.error('Failed to load groups')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenReport = (projectId: string, groupId: string) => {
        navigate(`/student/report/${projectId}/${groupId}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Project you joined
                </h1>
                <p className="text-muted-foreground">
                    Access your project groups and collaborative reports
                </p>
            </div>

            {groups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No Project Groups
                        </h3>
                        <p className="text-muted-foreground text-center">
                            You haven't been assigned to any project groups yet.
                            Contact your teacher for more information.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Card
                            key={group.id}
                            className="hover:shadow-lg transition-shadow"
                        >
                            <CardHeader
                                className="cursor-pointer"
                                onClick={() =>
                                    navigate(
                                        `/projects/${group.project.id}/groups/${group.id}`,
                                    )
                                }
                            >
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        {group.project.name}
                                    </CardTitle>
                                    <Badge
                                        variant={
                                            group.reportSubmitted
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {group.reportSubmitted
                                            ? 'Submitted'
                                            : 'Draft'}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {group.project.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Group: {group.name}</span>
                                        </div>

                                        {group.reportSubmittedDate && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Submitted:{' '}
                                                    {new Date(
                                                        group.reportSubmittedDate
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() =>
                                            handleOpenReport(
                                                group.project.id,
                                                group.id
                                            )
                                        }
                                        className="w-full"
                                        variant={
                                            group.reportSubmitted
                                                ? 'outline'
                                                : 'default'
                                        }
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        {group.reportSubmitted
                                            ? 'View Report'
                                            : 'Work on Report'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
