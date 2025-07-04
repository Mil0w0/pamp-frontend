import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ReportDefinition } from '@/services/ProjectService/project-api-client'

interface ReportProgressCardProps {
    reportDefinition: ReportDefinition | null
    completedAnswers: number
    progressPercentage: number
}

export function ReportProgressCard({
    reportDefinition,
    completedAnswers,
    progressPercentage,
}: ReportProgressCardProps) {
    if (reportDefinition?.format !== 'QUESTIONNAIRE') {
        return null
    }

    const totalQuestions = reportDefinition?.questions?.length || 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>
                    {completedAnswers} of {totalQuestions} questions answered
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Completion</span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${progressPercentage}%`,
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
