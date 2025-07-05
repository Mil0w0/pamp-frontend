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
        rules: [],
    })

    const [submission, setSubmission] = useState<SubmissionResponse | null>(
        null
    )
    const [stepSubmissions, setStepSubmissions] = useState<
        SubmissionResponse[] | null
    >(null)
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

    const loadSubmission = async () => {
        if (!stepId) return
        if (!projectId) return
        if (!currentUserGroup) return
        console.log(stepId)
        try {
            const response = await sumbissionService.getOneByStepAndGroup(
                stepId,
                projectId,
                currentUserGroup?.id
            )
            console.log('Submission')
            console.log(response)
            if (response.success) {
                if (response.data && response.data.length === 1) {
                    setSubmission(response.data[0])
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
                        <div className="mt-4 space-y-2 shadow-sm bg-white dark:bg-muted p-6  rounded-xl border">
                            <Label htmlFor="submission-link">Repo link</Label>
                            <Input
                                id="submission-link"
                                type="text"
                                className="w-fit"
                                value={submissionLocal.link}
                                onChange={handleLinkChange}
                            />
                            <p className="text-xs text-gray-500">
                                Paste your github or gitlab repo link here. Make
                                sure to make it public beforehand.
                            </p>
                            <Button onClick={() => checkConformity()}>
                                Send
                            </Button>

                            {submission &&
                                submission.link_type === 'github' && (
                                    <div className="flex mt-2 justify-start items-center gap-4 ">
                                        <p> Current file: </p>
                                        <GithubIcon />
                                        <p
                                            className="cursor-pointer"
                                            onClick={() =>
                                                (window.location.href =
                                                    submission?.link)
                                            }
                                        >
                                            Link: {submission.link}
                                            <ExternalLink />
                                        </p>
                                        <p>
                                            Created at:{' '}
                                            {DateTime.fromISO(
                                                submission.created_at
                                            ).toFormat('dd/MM/yyyy HH:mm')}
                                        </p>
                                        <p className="flex items-center gap-1">
                                            Status:
                                            {step.submissionDeadLine &&
                                            DateTime.fromISO(
                                                submission.created_at
                                            ) >
                                                DateTime.fromISO(
                                                    step.submissionDeadLine
                                                ) ? (
                                                <ClockIcon className="text-red-600" />
                                            ) : (
                                                <CheckIcon className="text-green-600" />
                                            )}
                                        </p>
                                        <p className="text-green-600">
                                            Conformity: {'100 %'}
                                        </p>
                                        <TrashIcon
                                            className="cursor-pointer"
                                            onClick={() => deleteFromS3()}
                                        />
                                    </div>
                                )}
                        </div>
                    </TabsContent>

                    <TabsContent value="file">
                        <div className=" mt-2 space-y-6 rounded-xl border p-6 shadow-sm bg-white dark:bg-muted w-full">
                            <div className="mt-4 space-y-2 w-fit">
                                <Label htmlFor="submission-file">
                                    Upload a file
                                </Label>
                                <Input
                                    id="submission-file"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <p className="text-xs text-gray-500">
                                    Size : 300MB max allowed.
                                </p>
                                <Button onClick={() => checkConformity()}>
                                    Send
                                </Button>
                            </div>
                            {submission && submission.link_type === 's3' && (
                                <div>
                                    <Label>Current file: </Label>
                                    <div className="flex mt-2 justify-start gap-4">
                                        <FileIcon />
                                        <p>File name: {submission.id}</p>
                                        <p>
                                            Created at:{' '}
                                            {DateTime.fromISO(
                                                submission.created_at
                                            ).toFormat('dd/MM/yyyy HH:mm')}
                                        </p>
                                        <p className="flex items-center gap-1">
                                            Status:
                                            {step.submissionDeadLine &&
                                            DateTime.fromISO(
                                                submission.created_at
                                            ) >
                                                DateTime.fromISO(
                                                    step.submissionDeadLine
                                                ) ? (
                                                <ClockIcon className="text-red-600" />
                                            ) : (
                                                <CheckIcon className="text-green-600" />
                                            )}
                                        </p>
                                        <TrashIcon
                                            className="cursor-pointer"
                                            onClick={() => deleteFromS3()}
                                        />
                                        <DownloadIcon
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const link =
                                                    document.createElement('a')
                                                link.href = submission?.link
                                                link.download = '' //set a name if we want to
                                                document.body.appendChild(link)
                                                link.click()
                                                document.body.removeChild(link)
                                            }}
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
