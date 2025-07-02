import { useParams } from 'react-router'
import { StepBox } from '@/components/ProjectPages/Steps/StepBox.tsx'
import { stepsService } from '@/services/ProjectService/project-api-client.ts'
import { toast } from 'sonner'
import { ChangeEvent, useEffect, useState } from 'react'
import { Step } from '@/components/ProjectPages/types.ts'
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
import { CheckIcon, FileIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import {
    SubmissionDTO,
    SubmissionResponse,
    SubmissionStatus,
} from '@/services/SubmissionService/types.ts'
import { sumbissionService } from '@/services/SubmissionService/submission-api-client.ts'

export function StepById() {
    const { stepId, projectId } = useParams()
    const [step, setStep] = useState<Partial<Step> | null>(null)
    const [isloading, setisLoading] = useState<boolean>(false)
    const [submissionLocal, setSubmissionLocal] = useState<SubmissionDTO>({
        project_uuid: projectId || '',
        group_uuid: '',
        link: '',
        link_type: '',
        project_step: stepId || '',
        rules: [],
    })
    const sampleSubmission: SubmissionResponse = {
        created_at: '2025-05-15T11:00:00Z',
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
    // const { currentProject } = useSelector((state: RootState) => state.project)
    const isStudent = currentUser?.role === 'STUDENT'

    const deleteFromS3 = async () => {
        console.log('NOT YET')
    }

    const loadSubmission = async () => {
        if (!stepId) return
        if (!step?.submissionId) return
        if (!projectId) return
        console.log(stepId)
        try {
            const response = await sumbissionService.getOneById(
                step.submissionId
            ) //fixme: get by step,group and project
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
    const handleS3LinkChange = (link: string) => {
        setSubmissionLocal({
            ...submissionLocal,
            link: link,
            link_type: 's3',
        })
    }

    const checkConformity = async () => {
        toast.info('Checking Conformity of the sumbitted file...')
        setisLoading(true)
        try {
            if (submissionLocal.link_type === 's3') {
                //Save file to s3
            }

            //Save submission on the service
            const response = await sumbissionService.createOne(submissionLocal)
            if (response.success) {
                //it got created
                toast.success(response.success)
            } else {
                //it didn't create
                //toast + display messaye that stay if it's error from rules.
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
        if (!projectId) return
        try {
            const response = await stepsService.getOneById(stepId, projectId)
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
    useEffect(() => {
        loadStep()
        loadSubmission()
    }, [stepId])

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

                    <TabsContent value="link">
                        <div className="mt-4 space-y-2">
                            <Label htmlFor="submission-link">Repo link</Label>
                            <Input
                                id="submission-link"
                                type="text"
                                className="w-fit"
                                value={submissionLocal.link}
                                defaultValue={submission?.link}
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
                    </TabsContent>

                    <TabsContent value="file">
                        <div className=" mt-2 space-y-6 rounded-xl border p-6 shadow-sm bg-white dark:bg-muted w-full">
                            <div className="mt-4 space-y-2 w-fit">
                                <Label htmlFor="submission-file">
                                    Upload a file
                                </Label>
                                <Input id="submission-file" type="file" />
                                <Button onClick={() => checkConformity()}>
                                    Send
                                </Button>
                            </div>
                            {/*TODO: afficher là le fichier retrieve from S3*/}
                            {submission && (
                                <div>
                                    <Label>Current file: </Label>
                                    <div className="flex mt-2 justify-start gap-4">
                                        <FileIcon />
                                        <p>File name: {submission.id}</p>
                                        <p>
                                            Created at: {submission.created_at}
                                        </p>
                                        <p className="flex ">
                                            Statut:{' '}
                                            {submission.status ===
                                                SubmissionStatus.COMPLETED && (
                                                <CheckIcon />
                                            )}
                                        </p>
                                        <TrashIcon
                                            className="cursor-pointer"
                                            onClick={() => deleteFromS3()}
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
