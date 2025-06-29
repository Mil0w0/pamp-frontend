
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ReportDefinition } from '@/services/ProjectService/project-api-client'

interface GradingRubricCardProps {
    reportDefinition: ReportDefinition | null
    isLoading: boolean
    isGrading: boolean
    onGradeSubmit: () => void
}

export function GradingRubricCard({
    reportDefinition,
    isLoading,
    isGrading,
    onGradeSubmit,
}: GradingRubricCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Grading Rubric</CardTitle>
                <CardDescription>
                    Assessment criteria for this report
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
                                        Questions:
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
                                    No specific instructions provided.
                                </div>
                            )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No report definition found for this project.
                    </div>
                )}
                <div className="mt-6 pt-6 border-t">
                    <Button
                        onClick={onGradeSubmit}
                        disabled={isGrading}
                        className="w-full flex items-center gap-2"
                    >
                        {isGrading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Submitting Grade...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Submit Grade & Feedback
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
