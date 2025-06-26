import { useParams } from 'react-router'
import { StepBox } from '@/components/ProjectPages/Steps/StepBox.tsx'
import { stepsService } from '@/services/ProjectService/project-api-client.ts'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Step } from '@/components/ProjectPages/types.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import {
    Tabs,
    TabsTrigger,
    TabsList,
    TabsContent,
} from '@/components/ui/tabs.tsx'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { CheckIcon, FileIcon, TrashIcon } from 'lucide-react'
import { Submission } from '@/components/ProjectPages/Steps/types.ts'
import { Button } from '@/components/ui/button.tsx'

export function StepById() {
    const { stepId, projectId } = useParams()
    const [step, setStep] = useState<Partial<Step> | null>(null)
    const [isloading, setisLoading] = useState<boolean>(false)
    const [submission, setSubmission] = useState<Submission | null>({
        id: 'dd',
        name: 'rendu-1',
        createdAt: '12/07/2020',
        creatorId: 'aajdj',
    })
    const { currentUser } = useSelector((state: RootState) => state.user)
    // const { currentProject } = useSelector((state: RootState) => state.project)
    const isStudent = currentUser?.role === 'STUDENT'

    const deleteFromS3 = async () => {
        console.log('NOT YET')
    }

    const loadSubmissionFromS3 = async () => {
        console.log('NOT YET')
        setSubmission(null)
        //Try to get file from s3 if step.submissuon link exists
    }

    const checkConformity = async () => {
        toast.info('Checking Conformity of the sumbitted file')
        setisLoading(true)
        setisLoading(false)
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
        loadSubmissionFromS3()
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
                <Tabs defaultValue="link" className="w-full mt-4">
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
                            />
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
                                        <p>File name: {submission.name}</p>
                                        <p>
                                            Created at: {submission.createdAt}
                                        </p>
                                        <p className="flex ">
                                            Statut: <CheckIcon />
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
