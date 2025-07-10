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
    Calendar,
    CheckIcon,
    ClockIcon,
    DownloadIcon,
    ExternalLink,
    FileIcon,
    GithubIcon,
    TrashIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import {
    SubmissionDTO,
    SubmissionResponse,
    ValidationError,
} from '@/services/SubmissionService/types.ts'
import { sumbissionService } from '@/services/SubmissionService/submission-api-client.ts'
import { createS3UploadFunction } from '@/utils/fileUpload.ts'
import { DateTime } from 'luxon'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import GroupsSubmissionDataTable from '@/components/ProjectPages/Steps/GroupsSubmissionDataTable.tsx'
import { ApiErrorMessage } from '@/services/ProjectService/types.ts'
import { Badge } from '@/components/ui/badge.tsx'

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

    const deleteFromS3 = async () => {
        //todo: implement
        toast.info('Submission deletion isnt available yet')
        //then remove submission in the microservice linked
    }
    const loadAllStepSubmissions = async () => {
        if (!stepId) return
        if (!projectId) return
        try {
            const response = await sumbissionService.getAllBySteps(
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
            const response = await sumbissionService.getOneByStepAndGroup(
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
            DateTime.fromISO(step.submissionDeadLine) > DateTime.now()
        ) {
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
                const response = await sumbissionService.createOne({
                    ...submissionLocal,
                    link: s3UrlUploaded ? s3UrlUploaded : submissionLocal.link,
                })
                console.log(response)
                if (
                    response.success &&
                    response.data &&
                    'data' in response.data
                ) {
                    //it got created
                    //Update step with the submissionID

                    toast.success(response.data.message)
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
        setisLoading(true)
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
        } finally {
            setisLoading(false)
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
    return (
        <div className="m-2">
            <StepBox
                step={step}
                index={0} //we display the step name instead of number in list here
            />
            {step.hasMandatorySubmission && isStudent ? (
                <Tabs
                    defaultValue={
                        submission?.link_type === 's3' ? 'file' : 'link'
                    }
                    className="w-full mt-4"
                >
                    <h2 className="text">Choose how to submit: </h2>
                    <TabsList>
                        <TabsTrigger value="link">Link</TabsTrigger>
                        <TabsTrigger value="file">File</TabsTrigger>
                    </TabsList>
                    {errors &&
                        errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-500">
                                {error}
                            </p>
                        ))}

                    <TabsContent value="link">
                        <div className="mt-4 space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:bg-muted">
                            {/* Input Section */}
                            <div className="space-y-2 w-full">
                                <Label htmlFor="submission-link">
                                    Repo link
                                </Label>
                                <Input
                                    id="submission-link"
                                    type="text"
                                    value={submissionLocal.link}
                                    onChange={handleLinkChange}
                                    className="w-1/3"
                                    placeholder="https://github.com/your-repo"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Paste your GitHub or GitLab repo link here.
                                    Make sure it’s public before submitting.
                                </p>
                                <Button onClick={checkConformity}>Send</Button>
                            </div>

                            {/* Submitted GitHub Link */}
                            {submission?.link_type === 'github' && (
                                <div className="rounded-md border p-4 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <GithubIcon className="h-4 w-4" />
                                        <span>Current Submission</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* Link */}
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-blue-600"
                                            onClick={() =>
                                                window.open(
                                                    submission.link,
                                                    '_blank'
                                                )
                                            }
                                        >
                                            <ExternalLink className="mr-1 h-4 w-4" />
                                            Open Link
                                        </Button>

                                        {/* Created At */}
                                        <div className="text-muted-foreground">
                                            <span className="font-medium">
                                                Created at:
                                            </span>{' '}
                                            {DateTime.fromISO(
                                                submission.created_at
                                            ).toFormat('dd/MM/yyyy HH:mm')}
                                        </div>

                                        {/* Status Badge */}
                                        <Badge
                                            variant={
                                                step.submissionDeadLine &&
                                                DateTime.fromISO(
                                                    submission.created_at
                                                ) >
                                                    DateTime.fromISO(
                                                        step.submissionDeadLine
                                                    )
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            {step.submissionDeadLine &&
                                            DateTime.fromISO(
                                                submission.created_at
                                            ) >
                                                DateTime.fromISO(
                                                    step.submissionDeadLine
                                                ) ? (
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

                                        {/* Conformity */}
                                        <Badge
                                            className={`font-medium ${
                                                conformityLevel === 0
                                                    ? 'bg-red-500'
                                                    : conformityLevel === 100
                                                      ? 'bg-green-500'
                                                      : 'bg-yellow-500'
                                            }`}
                                        >
                                            Conformity: {conformityLevel}%
                                        </Badge>

                                        <TrashIcon
                                            className="h-5 w-5 text-red-500 cursor-pointer"
                                            onClick={deleteFromS3}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="file">
                        <div className="mt-4 w-full space-y-6 rounded-xl border bg-white p-6 shadow-sm dark:bg-muted">
                            {/* Upload Section */}
                            <div className="space-y-2">
                                <Label htmlFor="submission-file">
                                    Upload a file
                                </Label>
                                <Input
                                    id="submission-file"
                                    type="file"
                                    onChange={handleFileChange}
                                    className={'w-1/3'}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max file size: 300MB
                                </p>
                                <Button onClick={checkConformity}>Send</Button>
                            </div>

                            {/* Current File Info */}
                            {submission?.link_type === 's3' && (
                                <div className="rounded-md border p-4 space-y-3">
                                    <Label className="text-sm font-semibold">
                                        Current Submission
                                    </Label>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                File ID: {submission.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                Uploaded:{' '}
                                                {DateTime.fromISO(
                                                    submission.created_at
                                                ).toFormat('dd/MM/yyyy HH:mm')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    step.submissionDeadLine &&
                                                    DateTime.fromISO(
                                                        submission.created_at
                                                    ) >
                                                        DateTime.fromISO(
                                                            step.submissionDeadLine
                                                        )
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                                className="gap-1"
                                            >
                                                {step.submissionDeadLine &&
                                                DateTime.fromISO(
                                                    submission.created_at
                                                ) >
                                                    DateTime.fromISO(
                                                        step.submissionDeadLine
                                                    ) ? (
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
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    conformityLevel === 0
                                                        ? 'text-red-500 border-red-500'
                                                        : conformityLevel ===
                                                            100
                                                          ? 'text-green-600 border-green-600'
                                                          : 'text-yellow-500 border-yellow-500'
                                                }
                                            >
                                                Conformity: {conformityLevel}%
                                            </Badge>
                                        </div>

                                        <TrashIcon
                                            className="h-5 w-5 text-muted-foreground hover:text-red-600 cursor-pointer"
                                            onClick={deleteFromS3}
                                        />

                                        <DownloadIcon
                                            className="h-5 w-5 text-muted-foreground hover:text-blue-600 cursor-pointer"
                                            onClick={() =>
                                                window.open(
                                                    submission.link,
                                                    '_blank',
                                                    'noopener,noreferrer'
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                !isStudent && (
                    <GroupsSubmissionDataTable
                        groups={currentProject?.groups}
                        submissions={stepSubmissions}
                        stepDeadline={step.submissionDeadLine}
                    />
                )
            )}
        </div>
    )
}
