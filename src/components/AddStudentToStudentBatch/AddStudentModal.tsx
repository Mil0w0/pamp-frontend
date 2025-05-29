import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { ChangeEvent, useState } from 'react'
import { Student } from '@/components/ManageStudentBatches/types.ts'
import { toast } from 'sonner'
import { makeStudentsFromFile } from '@/utils/studentCsvParser.ts'

type AddStudentModalProps = {
    selectedStudents: Student[]
    setSelectedStudents: (students: Student[]) => void
}

export default function AddStudentModal({
    setSelectedStudents,
    selectedStudents,
}: AddStudentModalProps) {
    const [openModal, setOpenModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [studentData, setStudentData] = useState<Student>({
        last_name: '',
        first_name: '',
        email: '',
        user_id: '',
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setSelectedFile(file)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        //make a fake id to handle the draggable object
        if (id === 'email') {
            setStudentData((prev) => ({ ...prev, ['user_id']: value }))
        }
        setStudentData((prev) => ({ ...prev, [id]: value }))
    }

    function addSingleNewStudent() {
        setIsLoading(true)

        if (
            studentData.last_name != '' &&
            studentData.first_name != '' &&
            studentData.email != ''
        ) {
            setSelectedStudents([...selectedStudents, studentData])
        } else {
            toast('Missing field for new student')
        }

        setIsLoading(false)
        setOpenModal(false)
    }

    async function addMultipleNewStudent() {
        setIsLoading(true)
        const extension =
            selectedFile?.name.split('.').pop()?.toLowerCase() || ''
        const allowedExtensions = ['csv']
        const allowedTypes = ['text/csv']

        if (!selectedFile) {
            toast.error('No file selected')
            return
        }
        if (!allowedExtensions.includes(extension)) {
            toast.error('Invalid file extension')
            return
        }
        if (!allowedTypes.includes(selectedFile.type)) {
            toast.error('Unsupported file type')
            return
        }

        try {
            const newStudents = await makeStudentsFromFile(
                selectedFile,
                extension
            )
            console.log(newStudents)
            setSelectedStudents([...selectedStudents, ...newStudents])
        } catch (e) {
            toast('Something went wrong: ' + e)
        } finally {
            setIsLoading(false)
            setOpenModal(false)
        }
    }

    return (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
                <Button className="mt-4" variant="outline">
                    Add a new student
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Fill the new student information</DialogTitle>
                    <DialogDescription>
                        You can also upload an excel file with the correct
                        format to add several students in a row.
                    </DialogDescription>
                </DialogHeader>
                <h3 className="text-md leading-none font-semibold">
                    Add multiple students
                </h3>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="studentsExcel">CSV file</Label>
                    <Input
                        id="studentsExcel"
                        type="file"
                        onChange={handleFileUpload}
                    />
                </div>
                <Button
                    style={{ cursor: 'pointer' }}
                    type="submit"
                    className="w-full"
                    onClick={() => addMultipleNewStudent()}
                    disabled={isLoading}
                >
                    Add multiple
                </Button>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-background text-muted-foreground relative z-10 px-2">
                        Or
                    </span>
                </div>
                <div className="flex flex-col gap-6">
                    <h3 className="text-md leading-none font-semibold">
                        Who is the new student ?
                    </h3>
                    <div className="grid gap-3">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="last_name">Last name</Label>
                        <Input
                            id="last_name"
                            type="text"
                            placeholder="Ex: Hernandez"
                            required
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                            id="first_name"
                            type="text"
                            placeholder="Ex: Paul"
                            required
                            onChange={handleChange}
                        />
                    </div>
                    <Button
                        style={{ cursor: 'pointer' }}
                        variant="secondary"
                        type="submit"
                        className="w-full"
                        onClick={() => addSingleNewStudent()}
                        disabled={isLoading}
                    >
                        Add one
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
