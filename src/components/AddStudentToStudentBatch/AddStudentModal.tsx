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
import {
    Student,
    StudentBatch,
} from '@/components/ManageStudentBatches/types.ts'
import {toast} from "sonner";
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
    const [studentData, setStudentData] = useState<Student>({} as Student)
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.currentTarget
        setStudentData((prev) => ({ ...prev, [id]: value }))
    }
    function addSingleNewStudent() {
        console.log(selectedStudents)
        setIsLoading(true)
        setSelectedStudents([...selectedStudents, studentData]) //todo: what if the user already exist tho ?
        setIsLoading(false)
        setOpenModal(false)
    }

    function addMultipleNewStudent(){
        //validate format: .xlsx only

        //parse file then add to selected
        try{

        }catch(e){
            toast("Something went wrong but idk where")
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
                    <Label htmlFor="studentsExcel">
                        Excel file(.xlsx only)
                    </Label>
                    <Input id="studentsExcel" type="file" />
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
                        type="submit"
                        className="w-full"
                        onClick={() => addSingleNewStudent()}
                        disabled={isLoading}
                    >
                        Add new student
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
