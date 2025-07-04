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
    SubmissionStatus,
    ValidationError,
} from '@/services/SubmissionService/types.ts'
import { sumbissionService } from '@/services/SubmissionService/submission-api-client.ts'
import { createS3UploadFunction } from '@/utils/fileUpload.ts'
import { DateTime } from 'luxon'
import LoadingSpinner from '@/components/ui/LoadingSpinner.tsx'
import GroupsSubmissionDataTable from '@/components/ProjectPages/Steps/GroupsSubmissionDataTable.tsx'

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
        project_step: stepId || '',
        rules: [],
    })
    const sampleSubmission: SubmissionResponse = {
        created_at: '2025-06-15T11:00:00Z',
        group_uuid: 'ecf78cb5-07fd-41fc-ae88-85e45b7edc51',
        id: '550e8400-e29b-41d4-a716-446655440000',
        link: 'https://pamp-reports-images.s3.eu-west-1.amazonaws.com/projects/ca690eb6-4bde-455c-aa12-52adef734223/groups/1544d099-d642-44a0-a440-7eca0d3f55ae/steps/15da4300-bbb3-47b6-aac2-8c1cd343fd81/18060267-24c2-4555-9921-9175292b8cb4.png',
        link_type: 's3',
        project_step: 'step_1',
        project_uuid: '550e8400-e29b-41d4-a716-446655440001',
        status: SubmissionStatus.COMPLETED,
        submitted_by: 'John Doe',
    }
    const sampleSubmission2: SubmissionResponse = {
        created_at: '2025-07-15T11:00:00Z',
        group_uuid: '1544d099-d642-44a0-a440-7eca0d3f55ae',
        id: '550e8400-e29b-41d4-a716-446655440000',
        link: 'https://github.com/user/repository.git',
        link_type: 'github',
        project_step: 'step_1',
        project_uuid: '550e8400-e29b-41d4-a716-446655440001',
        status: SubmissionStatus.COMPLETED,
        submitted_by: 'John Doe',
    }
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
        if (!step?.submissionId) return
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
        if (!step?.submissionId) return
        if (!projectId) return
        console.log(stepId)
        try {
            const response = await sumbissionService.getOneById(
                step.submissionId
            )
            if (response.success) {
                if (response.data && 'data' in response.data) {
                    setSubmission(response.data.data)
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
        console.log('checkConformity')

        //Check if user can submit even after a dealine
        if (!step) return
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
                if (response.success) {
                    //it got created
                    toast.success(response.success)
                } else {
                    //it didn't create
                    toast.error(response.error)
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
            console.log(error)
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
                bucketName: 'pamp-reports-images', //fixme: change bucket name
                keyPrefix: `projects/${currentProject.id}/groups/${currentUserGroup.id}/steps/${stepId}/`,
            })

            return await uploadToS3(file)
        } catch (err) {
            console.error(err)
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
    //Display a box to see and send submissions for this step
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
                        </div>
                        {submission && submission.link_type === 'github' && (
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
                                    DateTime.fromISO(submission.created_at) >
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
                            </div>
                        )}
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
                            {submission && (
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
                <GroupsSubmissionDataTable
                    groups={currentProject?.groups}
                    submissions={stepSubmissions}
                    stepDeadline={step.submissionDeadLine}
                />
            )}
        </div>
    )
}
