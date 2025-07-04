import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ReportDefinition } from '@/services/ProjectService/project-api-client'

interface ReportInstructionsCardProps {
    reportDefinition: ReportDefinition | null
    isLoading: boolean
}

export function ReportInstructionsCard({
    reportDefinition,
    isLoading,
}: ReportInstructionsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
                <CardDescription>
                    {isLoading
                        ? 'Loading instructions...'
                        : reportDefinition?.format === 'QUESTIONNAIRE'
                          ? 'Answer the questions below in your report'
                          : 'Follow these guidelines when writing your report'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading report instructions...
                    </div>
                ) : reportDefinition ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {reportDefinition.instruction && (
                            <div className="whitespace-pre-wrap text-sm mb-4">
                                {reportDefinition.instruction}
                            </div>
                        )}

                        {reportDefinition.format === 'QUESTIONNAIRE' &&
                            reportDefinition.questions && (
                                <div>
                                    <h4 className="font-semibold mb-3">
                                        Questions to Answer:
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2">
                                        {reportDefinition.questions.map(
                                            (question, index) => (
                                                <li
                                                    key={question.id || index}
                                                    className="text-sm"
                                                >
                                                    {question.text}
                                                </li>
                                            )
                                        )}
                                    </ol>
                                </div>
                            )}

                        {!reportDefinition.instruction &&
                            reportDefinition.format === 'CLASSIC' && (
                                <div className="text-sm text-muted-foreground italic">
                                    No specific instructions provided. Please
                                    write a comprehensive report about your
                                    project.
                                </div>
                            )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Report is deactivate for this project. Please contact
                        your instructor.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
