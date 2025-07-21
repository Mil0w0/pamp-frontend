import { useParams } from 'react-router'
import { StepBox } from '@/components/ProjectPages/Steps/StepBox.tsx'
import { stepsService } from '@/services/ProjectService/project-api-client.ts'
import { toast } from 'sonner'
import { ChangeEvent, useEffect, useState } from 'react'
import { ProjectGroup, Step } from '@/components/ProjectPages/types.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
    AlertTriangle,
    AlertCircle,
    Calendar,
    CheckCircle,
    CheckIcon,
    ClockIcon,
    DownloadIcon,
    ExternalLink,
    FileIcon,
    FileText,
    GithubIcon,
    Link2,
    TrashIcon,
    Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import {
    SubmissionDTO,
    SubmissionResponse,
    ValidationError,
} from '@/services/SubmissionService/types.ts'
import { submissionService } from '@/services/SubmissionService/submission-api-client.ts'
import {
    createS3UploadFunction,
    handleSubmissionDownload,
} from '@/utils/fileUpload.ts'
import { DateTime } from 'luxon'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import GroupsSubmissionDataTable from '@/components/ProjectPages/Steps/GroupsSubmissionDataTable.tsx'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'
import { Badge } from '@/components/ui/badge.tsx'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

// New component for displaying existing submissions in a table format
function SubmissionsTable({
    submission,
    step,
    conformityLevel,
    onDelete,
}: {
    submission: SubmissionResponse | null
    step: Partial<Step> | null
    conformityLevel: number
    onDelete: () => void
}) {
    if (!submission) {
        return (
            <Card className="bg-white dark:bg-muted">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Submissions for this step
                    </CardTitle>
                    <CardDescription>
                        No submissions have been made for this step yet
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No submissions yet</p>
                        <p className="text-sm">
                            Submit your work using the form below
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isLate =
        step?.submissionDeadLine &&
        DateTime.fromISO(submission.created_at) >
            DateTime.fromISO(step.submissionDeadLine)

    return (
        <Card className="bg-white dark:bg-muted">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Submissions for this step
                    <Badge variant="default">1</Badge>
                </CardTitle>
                <CardDescription>
                    Your submission details and status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-muted/50 px-4 py-3 border-b">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                            <div className="col-span-3">Type & Link</div>
                            <div className="col-span-3">Submitted</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Conformity</div>
                            <div className="col-span-2">Actions</div>
                        </div>
                    </div>

                    {/* Table Row */}
                    <div className="px-4 py-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Type & Link */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-2">
                                    {submission.link_type === 'github' ? (
                                        <GithubIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div className="flex flex-col">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs w-fit"
                                        >
                                            {submission.link_type === 'github'
                                                ? 'GitHub'
                                                : 'File'}
                                        </Badge>
                                        {submission.link_type === 'github' && (
                                            <span className="text-xs text-muted-foreground mt-1 truncate max-w-32">
                                                {submission.link}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submitted */}
                            <div className="col-span-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {DateTime.fromISO(
                                                submission.created_at
                                            ).toFormat('dd/MM/yyyy')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {DateTime.fromISO(
                                                submission.created_at
                                            ).toFormat('HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                                <Badge
                                    variant={isLate ? 'destructive' : 'default'}
                                    className="flex items-center gap-1 w-fit"
                                >
                                    {isLate ? (
                                        <>
                                            <ClockIcon className="h-3 w-3" />
                                            Late
                                        </>
                                    ) : (
                                        <>
                                            <CheckIcon className="h-3 w-3" />
                                            On time
                                        </>
                                    )}
                                </Badge>
                            </div>

                            {/* Conformity */}
                            <div className="col-span-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Badge
                                            variant="outline"
                                            className={`cursor-pointer font-medium ${
                                                conformityLevel === 0
                                                    ? 'text-red-500 border-red-500'
                                                    : conformityLevel === 100
                                                      ? 'text-green-600 border-green-600'
                                                      : 'text-yellow-500 border-yellow-500'
                                            }`}
                                        >
                                            Conformity: {conformityLevel}%
                                        </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96 max-h-80 overflow-auto p-4 space-y-3">
                                        {submission?.rule_results &&
                                        submission.rule_results.length > 0 ? (
                                            submission.rule_results.map(
                                                (rule, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-2 rounded border text-sm ${
                                                            rule.passed
                                                                ? 'border-green-300 bg-green-50 dark:bg-muted'
                                                                : 'border-red-300 bg-red-50  dark:bg-muted'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold">
                                                                {rule.rule_name}
                                                            </span>
                                                            {rule.passed ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {rule.message}
                                                        </p>

                                                        {/* Show error details if rule failed */}
                                                        {!rule.passed &&
                                                            rule.error_details?.errors?.map(
                                                                (err, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="mt-1 text-xs text-red-700"
                                                                    >
                                                                        -{' '}
                                                                        {
                                                                            err.message
                                                                        }
                                                                        {err.failed_files?.map(
                                                                            (
                                                                                file,
                                                                                fi
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        fi
                                                                                    }
                                                                                    className="ml-2 text-red-500"
                                                                                >
                                                                                    File:{' '}
                                                                                    {
                                                                                        file.file
                                                                                    }{' '}
                                                                                    –{' '}
                                                                                    {
                                                                                        file.reason
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Everything is clear.
                                            </p>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                            handleSubmissionDownload(
                                                submission.link,
                                                submission.link_type
                                            )
                                        }
                                    >
                                        {submission.link_type === 'github' ? (
                                            <ExternalLink className="h-4 w-4" />
                                        ) : (
                                            <DownloadIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                        onClick={onDelete}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function StepById() {
    const { stepId, projectId } = useParams()
    const [step, setStep] = useState<Partial<Step> | null>(null)
    const [isloading, setisLoading] = useState<boolean>(false)
    const [errors, setErrors] = useState<string[] | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const [submissionLocal, setSubmissionLocal] = useState<SubmissionDTO>({
        project_uuid: projectId || '',
        group_uuid: '',
        link: '',
        link_type: '',
        project_step_uuid: stepId || '',
        rules: null,
    })

    const [submission, setSubmission] = useState<SubmissionResponse | null>(
        null
    )
    const [stepSubmissions, setStepSubmissions] = useState<
        SubmissionResponse[] | null
    >(null)
    const [conformityLevel, setConformityLevel] = useState(0)
    const { currentUser } = useSelector((state: RootState) => state.user)
    const { currentProject } = useSelector((state: RootState) => state.project)
    const isStudent = currentUser?.role === 'STUDENT'
    const [currentUserGroup, setCurrentUserGroup] =
        useState<ProjectGroup | null>(null)

    const deleteSubmission = async () => {
        if (!submission) {
            toast.error('No submission to delete')
            return
        }
        try {
            const response = await submissionService.deleteOne(submission.id)

            if (response.success) {
                toast.success('Submission deleted successfully')
                setSubmission(null)
                setConformityLevel(0)
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error while deleting submission')
            console.error(error)
        }
    }

    const loadAllStepSubmissions = async () => {
        if (!stepId) return
        if (!projectId) return
        try {
            const response = await submissionService.getAllBySteps(
                stepId,
                projectId
            )
            if (response.success) {
                if (response.data) {
                    setStepSubmissions(response.data)
                    console.log(response.data)
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error : Error while fetching submission')
            console.error(error)
        } finally {
            setisLoading(false)
        }
    }

    const calculateSubmissionConformity = () => {
        if (!submission) return 0
        const FULLY_CONFORM = 100
        const rulesResults = submission.rule_results
        if (!rulesResults) {
            setConformityLevel(FULLY_CONFORM)
            return
        }

        if (rulesResults?.every((rule) => rule.passed)) {
            setConformityLevel(FULLY_CONFORM)
        } else {
            //calculate the conformity. Each rule not passed removes an equal percent of conformity
            const passedCount = rulesResults.filter(
                (rule) => rule.passed
            ).length

            setConformityLevel(
                Math.ceil((passedCount / rulesResults.length) * 100)
            )
        }
    }

    const loadSubmission = async () => {
        if (!stepId) return
        if (!projectId) return
        if (!currentUserGroup) return

        try {
            const response = await submissionService.getOneByStepAndGroup(
                stepId,
                projectId,
                currentUserGroup?.id
            )
            console.log('Submission')
            console.log(response)
            if (response.success) {
                if (response.data && 'data' in response.data) {
                    setSubmission({
                        ...response.data.data,
                        rule_results: response.data.rule_results,
                    })
                }
            } else {
                if (response.error === '404') {
                    console.log()
                    //No submission for this trio
                    return
                }
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error : Error while fetching submission')
            console.error(error)
        } finally {
            setisLoading(false)
        }
    }

    const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSubmissionLocal({
            ...submissionLocal,
            link: e.currentTarget.value,
            link_type: 'github',
            group_uuid: currentUserGroup?.id || '',
        })
    }

    const checkConformity = async () => {
        setisLoading(true)
        console.log(submissionLocal)

        //Check if user can submit even after a dealine
        if (!step) return
        if (!projectId) return
        if (
            !step.allowSubmittingAfterDeadLine &&
            step.submissionDeadLine &&
            DateTime.fromISO(step.submissionDeadLine) < DateTime.now()
        ) {
            setisLoading(false)
            toast.error(
                'It is too late to submit something. Contact your teacher or cry'
            )
            return
        }

        let s3UrlUploaded: string | null = null
        try {
            if (submissionLocal.link_type === 's3') {
                //Save file to s3
                s3UrlUploaded = await uploadFile()
            }
            if (
                s3UrlUploaded ||
                (submissionLocal.link && submissionLocal.link.length > 0)
            ) {
                //Save submission on the service
                const response = await submissionService.createOne({
                    ...submissionLocal,
                    link: s3UrlUploaded ? s3UrlUploaded : submissionLocal.link,
                })
                console.log(response)
                if (
                    response.success &&
                    response.data &&
                    'data' in response.data
                ) {
                    //Check conformity since we force_rules
                    const ruleResults = response.data.rule_results
                    if (
                        ruleResults &&
                        Array.isArray(ruleResults) &&
                        ruleResults.some((rule) => !rule.passed)
                    ) {
                        toast.info(
                            response.data.message +
                                " but some conformity rules didn't pass."
                        )
                    } else {
                        toast.success(response.data.message)
                    }
                    // Reload submission data
                    await loadSubmission()
                    // Clear form
                    setSubmissionLocal({
                        ...submissionLocal,
                        link: '',
                    })
                    setFile(null)
                    setErrors(null)
                } else {
                    //it didn't create
                    if (response.data && response.data instanceof Array) {
                        setErrors(
                            response.data.map(
                                (error: ValidationError) => error.msg
                            )
                        )
                    }
                }
            }
        } catch (error) {
            toast.error('Something went wrong')
            console.error(error)
        } finally {
            setisLoading(false)
        }
    }

    //Load step data
    const loadStep = async () => {
        if (!stepId) return
        if (!currentProject) return

        setSubmissionLocal({
            ...submissionLocal,
            group_uuid: currentUserGroup?.id || '',
        })
        try {
            //Fetch step
            const response = await stepsService.getOneById(
                stepId,
                currentProject.id
            )
            if (response.success) {
                if (response.data) {
                    setStep(response.data)
                    setSubmissionLocal({
                        ...submissionLocal,
                        rules: response.data.submissionConformityRules,
                    })
                    console.log('STEP data')
                    console.log(response.data)
                }
            } else {
                toast.error(response.error)
            }
        } catch (error) {
            toast.error('Error : No step found correctly')
            console.error(error)
        } finally {
            setisLoading(false)
        }
    }

    //Identify the user group
    const loadCurrentGroup = async () => {
        if (!currentProject) return
        if (!currentUser) return

        const currentUserGroup = currentProject?.groups?.find((group) =>
            group.studentsIds?.split(',').includes(currentUser?.user_id ?? '')
        )
        if (currentUserGroup) {
            setCurrentUserGroup(currentUserGroup)
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        console.log('selectedFile', selectedFile)
        if (selectedFile) {
            setFile(selectedFile)
        }

        //SAVE SUBMISSION WITH S3 lINK
        setSubmissionLocal({
            ...submissionLocal,
            group_uuid: currentUserGroup?.id || '',
            link_type: 's3',
        })
    }

    const uploadFile = async () => {
        if (!file) {
            toast.error('No file to upload')
            return null
        }
        if (!currentProject) {
            toast.error('No project selected')
            return null
        }
        if (!currentUserGroup) {
            toast.error('No group found for this user')
            return null
        }

        try {
            const uploadToS3 = createS3UploadFunction({
                maxFileSize: 300 * 1024 * 1024,
                allowedFileTypes: [
                    'application/pdf',
                    'application/zip',
                    'application/x-zip-compressed',
                    'application/x-zip',
                    '.zip',
                    // word documents
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    // excel documents
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    // powerpoint documents
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    // text files
                    'text/plain',
                    'text/csv',
                    'text/tab-separated-values',
                ],
                bucketName: 'pamp-step-submission',
                keyPrefix: `projects/${currentProject.id}/groups/${currentUserGroup.id}/steps/${stepId}/`,
            })

            return await uploadToS3(file)
        } catch (err) {
            const error = err as ApiErrorMessage
            console.error(err)
            toast.error(error.message)
            return null
        }
    }

    useEffect(() => {
        loadStep()
        loadSubmission()
        loadCurrentGroup()
        if (isStudent) return
        loadAllStepSubmissions()
    }, [currentProject, stepId, projectId, currentUser])

    useEffect(() => {
        calculateSubmissionConformity()
    }, [submission])

    //Display Step Box
    if (isloading) {
        return <LoadingSpinner />
    }
    if (!step) return null

    const isAfterDeadline =
        step.submissionDeadLine &&
        DateTime.fromISO(step.submissionDeadLine) < DateTime.now()

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 space-y-8">
                {/* Step Information */}
                <StepBox
                    step={step}
                    index={0} //we display the step name instead of number in list here
                />

                {isStudent ? (
                    <div className="space-y-8">
                        {/* Existing Submissions Section */}
                        <SubmissionsTable
                            submission={submission}
                            step={step}
                            conformityLevel={conformityLevel}
                            onDelete={deleteSubmission}
                        />

                        {/* New Submission Section */}
                        {step.hasMandatorySubmission && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="h-5 w-5" />
                                        Submit new work
                                    </CardTitle>
                                    <CardDescription>
                                        Choose how you want to submit your work
                                        for this step
                                        {step.submissionDeadLine && (
                                            <span className="block mt-1">
                                                Deadline:{' '}
                                                {DateTime.fromISO(
                                                    step.submissionDeadLine
                                                ).toFormat('dd/MM/yyyy HH:mm')}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isAfterDeadline &&
                                        !step.allowSubmittingAfterDeadLine && (
                                            <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-red-800 text-sm">
                                                    The submission deadline has
                                                    passed. Contact your teacher
                                                    if you need to submit late.
                                                </p>
                                            </div>
                                        )}

                                    {errors && errors.length > 0 && (
                                        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    {errors.map(
                                                        (error, index) => (
                                                            <p
                                                                key={index}
                                                                className="text-red-800 text-sm"
                                                            >
                                                                {error}
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Tabs
                                        defaultValue="link"
                                        className="w-full"
                                    >
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger
                                                value="link"
                                                className="flex items-center gap-2"
                                            >
                                                <Link2 className="h-4 w-4" />
                                                Repository Link
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="file"
                                                className="flex items-center gap-2"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent
                                            value="link"
                                            className="space-y-6 mt-6"
                                        >
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="repo-link"
                                                        className="text-base font-medium"
                                                    >
                                                        Repository URL
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <GithubIcon className="h-5 w-5 text-muted-foreground" />
                                                        <Input
                                                            id="repo-link"
                                                            type="url"
                                                            value={
                                                                submissionLocal.link
                                                            }
                                                            onChange={
                                                                handleLinkChange
                                                            }
                                                            placeholder="https://github.com/username/repository"
                                                            className="flex-1"
                                                            disabled={Boolean(
                                                                isAfterDeadline &&
                                                                    !step.allowSubmittingAfterDeadLine
                                                            )}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Make sure your
                                                        repository is public and
                                                        accessible before
                                                        submitting.
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={checkConformity}
                                                    disabled={
                                                        !submissionLocal.link ||
                                                        isloading ||
                                                        Boolean(
                                                            isAfterDeadline &&
                                                                !step.allowSubmittingAfterDeadLine
                                                        )
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    {isloading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Submit Repository
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent
                                            value="file"
                                            className="space-y-6 mt-6"
                                        >
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="file-upload"
                                                        className="text-base font-medium"
                                                    >
                                                        Select File
                                                    </Label>
                                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                                                        <div className="flex flex-col items-center space-y-2">
                                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                                            <div className="text-center">
                                                                <Input
                                                                    id="file-upload"
                                                                    type="file"
                                                                    onChange={
                                                                        handleFileChange
                                                                    }
                                                                    className="cursor-pointer"
                                                                    disabled={Boolean(
                                                                        isAfterDeadline &&
                                                                            !step.allowSubmittingAfterDeadLine
                                                                    )}
                                                                />
                                                                <p className="text-sm text-muted-foreground mt-2">
                                                                    Maximum file
                                                                    size: 300MB
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Supported
                                                                    formats:
                                                                    PDF, ZIP,
                                                                    Word, Excel,
                                                                    PowerPoint,
                                                                    Text files
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {file && (
                                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">
                                                                {file.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                (
                                                                {(
                                                                    file.size /
                                                                    1024 /
                                                                    1024
                                                                ).toFixed(
                                                                    1
                                                                )}{' '}
                                                                MB)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    onClick={checkConformity}
                                                    disabled={
                                                        !file ||
                                                        isloading ||
                                                        Boolean(
                                                            isAfterDeadline &&
                                                                !step.allowSubmittingAfterDeadLine
                                                        )
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    {isloading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Upload File
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    // Teacher view - show all group submissions
                    <GroupsSubmissionDataTable
                        groups={currentProject?.groups}
                        submissions={stepSubmissions}
                        stepDeadline={step.submissionDeadLine}
                    />
                )}
            </div>
        </div>
    )
}
