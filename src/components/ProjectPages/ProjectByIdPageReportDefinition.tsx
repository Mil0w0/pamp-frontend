import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { useEffect, useState } from 'react'
import { fetchAllProjects, fetchProjectById } from '@/store/project.slice'
import { useParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDownIcon, PlusIcon, TrashIcon } from 'lucide-react'

type ReportFormat = 'classic' | 'questionnaire'

interface Question {
    id: string
    text: string
}

interface ReportConfiguration {
    isReportMandatory: boolean
    reportFormat: ReportFormat
    instructions: string
    questions: Question[]
}

export default function ProjectByIdPageReportDefinition() {
    const { projectId } = useParams()
    const dispatch = useDispatch<AppDispatch>()
    const { currentProject } = useSelector((state: RootState) => state.project)

    const [reportConfig, setReportConfig] = useState<ReportConfiguration>({
        isReportMandatory: false,
        reportFormat: 'classic',
        instructions: '',
        questions: [],
    })

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId))
        }
        dispatch(fetchAllProjects())
    }, [dispatch, projectId])

    const handleMandatoryReportChange = (checked: boolean) => {
        setReportConfig((prev) => ({
            ...prev,
            isReportMandatory: checked,
        }))
    }

    const handleReportFormatChange = (format: ReportFormat) => {
        setReportConfig((prev) => ({
            ...prev,
            reportFormat: format,
            // Reset format-specific fields when changing format
            instructions: format === 'classic' ? prev.instructions : '',
            questions:
                format === 'questionnaire'
                    ? prev.questions.length > 0
                        ? prev.questions
                        : [
                              {
                                  id: Math.random().toString(36).substr(2, 9),
                                  text: '',
                              },
                          ]
                    : [],
        }))
    }

    const handleInstructionsChange = (instructions: string) => {
        setReportConfig((prev) => ({
            ...prev,
            instructions,
        }))
    }

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Math.random().toString(36).substr(2, 9),
            text: '',
        }
        setReportConfig((prev) => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
        }))
    }

    const updateQuestion = (id: string, text: string) => {
        setReportConfig((prev) => ({
            ...prev,
            questions: prev.questions.map((q) =>
                q.id === id ? { ...q, text } : q
            ),
        }))
    }

    const removeQuestion = (id: string) => {
        setReportConfig((prev) => ({
            ...prev,
            questions: prev.questions.filter((q) => q.id !== id),
        }))
    }

    const getFormatDisplayName = (format: ReportFormat) => {
        switch (format) {
            case 'classic':
                return 'Classic Report with Instructions'
            case 'questionnaire':
                return 'Questionnaire (Multiple Questions)'
            default:
                return 'Select Format'
        }
    }

    const isValidConfiguration = () => {
        if (!reportConfig.isReportMandatory) return true

        const instructionsValid = reportConfig.instructions.length <= 500

        if (reportConfig.reportFormat === 'classic') {
            return (
                reportConfig.instructions.trim().length > 0 && instructionsValid
            )
        } else {
            return (
                instructionsValid &&
                reportConfig.questions.length > 0 &&
                reportConfig.questions.every(
                    (q) => q.text.trim().length > 0 && q.text.length <= 250
                )
            )
        }
    }

    if (!currentProject) {
        return <Skeleton />
    }

    return (
        <div>
            <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/projects">
                                    Projects
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    {currentProject.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Report Definition
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h1 className="text-2xl">
                    Report Configuration: {currentProject.name}
                </h1>

                <div className="grid auto-rows-min gap-6 md:grid-cols-1 max-w-2xl">
                    {/* Mandatory Report Checkbox */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="mandatory-report"
                                checked={reportConfig.isReportMandatory}
                                onCheckedChange={handleMandatoryReportChange}
                            />
                            <Label
                                htmlFor="mandatory-report"
                                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Activate mandatory report for this project
                            </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                            When enabled, students will be required to submit a
                            report for this project.
                        </p>
                    </div>

                    {/* Report Format Selection */}
                    {reportConfig.isReportMandatory && (
                        <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
                            <Label className="text-base font-medium">
                                Report Format
                            </Label>
                            <div className="space-y-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between max-w-md"
                                        >
                                            {getFormatDisplayName(
                                                reportConfig.reportFormat
                                            )}
                                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full min-w-[300px]">
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleReportFormatChange(
                                                    'classic'
                                                )
                                            }
                                        >
                                            <div className="flex flex-col space-y-1">
                                                <span className="font-medium">
                                                    Classic Report with
                                                    Instructions
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    Single report with
                                                    predefined instructions
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                handleReportFormatChange(
                                                    'questionnaire'
                                                )
                                            }
                                        >
                                            <div className="flex flex-col space-y-1">
                                                <span className="font-medium">
                                                    Questionnaire (Multiple
                                                    Questions)
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    Structured questionnaire
                                                    with custom questions
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <p className="text-sm text-muted-foreground">
                                    {reportConfig.reportFormat === 'classic'
                                        ? 'Students will receive a single report template with instructions to complete.'
                                        : 'You can create multiple questions that students will need to answer in their report.'}
                                </p>
                            </div>

                            {/* Instructions Field for Classic Format */}
                            {reportConfig.reportFormat === 'classic' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="instructions"
                                            className="text-sm font-medium"
                                        >
                                            Instructions{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <span
                                            className={`text-xs ${reportConfig.instructions.length > 500 ? 'text-red-500' : reportConfig.instructions.length > 400 ? 'text-orange-500' : 'text-muted-foreground'}`}
                                        >
                                            {reportConfig.instructions.length}
                                            /500
                                        </span>
                                    </div>
                                    <textarea
                                        id="instructions"
                                        placeholder="Enter the instructions for the report..."
                                        value={reportConfig.instructions}
                                        onChange={(e) =>
                                            handleInstructionsChange(
                                                e.target.value
                                            )
                                        }
                                        className={`flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical ${
                                            reportConfig.instructions.trim()
                                                .length === 0 ||
                                            reportConfig.instructions.length >
                                                500
                                                ? 'border-red-300 bg-red-50/50'
                                                : 'border-input bg-background'
                                        }`}
                                        rows={4}
                                        maxLength={500}
                                    />
                                    {reportConfig.instructions.trim().length ===
                                        0 && (
                                        <p className="text-xs text-red-500">
                                            Instructions are required for
                                            classic reports.
                                        </p>
                                    )}
                                    {reportConfig.instructions.length > 500 && (
                                        <p className="text-xs text-red-500">
                                            Instructions must be 500 characters
                                            or less.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Questions Management for Questionnaire Format */}
                            {reportConfig.reportFormat === 'questionnaire' && (
                                <div className="space-y-4">
                                    {/* Optional Instructions for Questionnaire */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="questionnaire-instructions"
                                                className="text-sm font-medium"
                                            >
                                                Instructions (Optional)
                                            </Label>
                                            <span
                                                className={`text-xs ${reportConfig.instructions.length > 500 ? 'text-red-500' : reportConfig.instructions.length > 400 ? 'text-orange-500' : 'text-muted-foreground'}`}
                                            >
                                                {
                                                    reportConfig.instructions
                                                        .length
                                                }
                                                /500
                                            </span>
                                        </div>
                                        <textarea
                                            id="questionnaire-instructions"
                                            placeholder="Enter optional instructions for the questionnaire..."
                                            value={reportConfig.instructions}
                                            onChange={(e) =>
                                                handleInstructionsChange(
                                                    e.target.value
                                                )
                                            }
                                            className={`flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical ${
                                                reportConfig.instructions
                                                    .length > 500
                                                    ? 'border-red-300 bg-red-50/50'
                                                    : 'border-input bg-background'
                                            }`}
                                            rows={3}
                                            maxLength={500}
                                        />
                                        {reportConfig.instructions.length >
                                            500 && (
                                            <p className="text-xs text-red-500">
                                                Instructions must be 500
                                                characters or less.
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            These instructions will be shown to
                                            students before they answer the
                                            questions.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Questions{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addQuestion}
                                            className="flex items-center gap-2"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            Add Question
                                        </Button>
                                    </div>

                                    {reportConfig.questions.length === 0 && (
                                        <p className="text-sm text-red-500">
                                            At least one question is required
                                            for questionnaire reports.
                                        </p>
                                    )}

                                    <div className="space-y-3">
                                        {reportConfig.questions.map(
                                            (question, index) => (
                                                <div
                                                    key={question.id}
                                                    className="flex items-start gap-2 p-3 border rounded-md"
                                                >
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label
                                                                htmlFor={`question-${question.id}`}
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                Question{' '}
                                                                {index + 1}
                                                            </Label>
                                                            <span
                                                                className={`text-xs ${question.text.length > 250 ? 'text-red-500' : question.text.length > 200 ? 'text-orange-500' : 'text-muted-foreground'}`}
                                                            >
                                                                {
                                                                    question
                                                                        .text
                                                                        .length
                                                                }
                                                                /250
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            id={`question-${question.id}`}
                                                            placeholder="Enter your question..."
                                                            value={
                                                                question.text
                                                            }
                                                            onChange={(e) =>
                                                                updateQuestion(
                                                                    question.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical ${
                                                                question.text.trim()
                                                                    .length ===
                                                                    0 ||
                                                                question.text
                                                                    .length >
                                                                    250
                                                                    ? 'border-red-300 bg-red-50/50'
                                                                    : 'border-input bg-background'
                                                            }`}
                                                            rows={3}
                                                            maxLength={250}
                                                        />
                                                        {question.text.length >
                                                            250 && (
                                                            <p className="text-xs text-red-500">
                                                                Question must be
                                                                250 characters
                                                                or less.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeQuestion(
                                                                question.id
                                                            )
                                                        }
                                                        className="mt-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Configuration Button */}
                    <div className="pt-4">
                        <Button
                            className="w-fit"
                            disabled={!isValidConfiguration()}
                            onClick={() => {
                                // TODO: Implement save functionality
                                console.log(
                                    'Report configuration:',
                                    reportConfig
                                )
                            }}
                        >
                            Save Report Configuration
                        </Button>
                        {!isValidConfiguration() &&
                            reportConfig.isReportMandatory && (
                                <p className="text-sm text-red-500 mt-2">
                                    {reportConfig.reportFormat === 'classic'
                                        ? 'Please provide instructions for the classic report (max 500 characters).'
                                        : 'Please ensure instructions are under 500 characters and add at least one question with text (max 250 characters per question).'}
                                </p>
                            )}
                    </div>
                </div>
            </div>
        </div>
    )
}
