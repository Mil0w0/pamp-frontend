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
import { OpenLinkButton } from '@blocknote/react'

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
        created_at: '2025-07-15T11:00:00Z',
        group_uuid: '550e8400-e29b-41d4-a716-446655440002',
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
        })
    }

    const checkConformity = async () => {
        setisLoading(true)

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

        let didUpload = true
        try {
            if (submissionLocal.link_type === 's3') {
                //Save file to s3
                didUpload = await uploadFile()
            }
            if (didUpload) {
                //Save submission on the service
                const response =
                    await sumbissionService.createOne(submissionLocal)
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
            console.log(error)
        } finally {
            setisLoading(false)
        }
    }

    //Load step data
    const loadStep = async () => {
        if (!stepId) return
        if (!currentProject) return

        //Identify the user group
        const currentUserGroup = currentProject?.groups?.find((group) =>
            group.studentsIds?.split(',').includes(currentUser?.user_id ?? '')
        )
        if (currentUserGroup) {
            setCurrentUserGroup(currentUserGroup)
        }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        console.log('selectedFile', selectedFile)
        if (selectedFile) {
            setFile(selectedFile)
        }

        //SAVE SUBMISSION WITH S3 lINK
        const s3Link = ''
        setSubmissionLocal({
            ...submissionLocal,
            link: s3Link,
            link_type: 's3',
        })
    }

    const uploadFile = async () => {
        setisLoading(true)
        if (!file) {
            toast.error('No file to upload')
            return false
        }
        if (!currentProject) {
            toast.error('No project selected')
            return false
        }
        if (!currentUserGroup) {
            toast.error('No group found for this user')
            return false
        }

        try {
            const uploadToS3 = createS3UploadFunction({
                maxFileSize: 300 * 1024 * 1024,
                bucketName: 'pamp-step-submission',
                keyPrefix: `projects/${currentProject.id}/groups/${currentUserGroup.id}/steps/${stepId}/`,
            })

            const uploadedUrl = await uploadToS3(file)
            setSubmissionLocal({ ...submissionLocal, link: uploadedUrl })
            toast.success('Upload successful!')
            return true
        } catch (err) {
            console.error(err)
            toast.error('Upload failed.')
            return false
        } finally {
            setisLoading(false)
        }
    }

    useEffect(() => {
        loadStep()
        loadSubmission()
    }, [step, currentProject, stepId, projectId])

    //Display Step Box
    //Display a box to see and send submissions for this step
    if (isloading) {
        return 'loading'
    }
    if (!step) return null
    return (
        <div className="m-2">
            <StepBox
                step={step}
                index={0} //todo: get step number
            />
            {step.hasMandatorySubmission && isStudent && (
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
            )}
        </div>
    )
}
