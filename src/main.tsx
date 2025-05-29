import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LogIn from '@/components/LogIn/LogIn.tsx'
import TeacherRegister from '@/components/Register/TeacherRegister.tsx'
import CenteredLayout from '@/components/layout/CenteredLayout.tsx'
import CustomHeader from '@/components/CustomHeader.tsx'
import StudentBatchesPage from '@/components/ManageStudentBatches/StudentBatchesPage.tsx'
import { Error404 } from '@/components/Error/Error404.tsx'
import { Toaster } from 'sonner'
import StudentBatchById from '@/components/ManageStudentBatches/StudentBatchById.tsx'
import { ThemeProvider } from '@/components/ui/theme-provider'
import AuthCallback from '@/components/LogIn/AuthCallback.tsx'
import Logout from '@/components/LogIn/Logout.tsx'
import ProjectsPage from "@/components/ManageProjects/ProjectsPage.tsx";
import ProjectByIdPage from "@/components/ManageProjects/ProjectByIdPage.tsx";

createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
            <CustomHeader />
            <Routes>
                <Route element={<CenteredLayout />}>
                    <Route path="/login" element={<LogIn />} />
                    <Route
                        path="/register/teacher"
                        element={<TeacherRegister />}
                    />
                    <Route path="/" element={<App />} />
                </Route>
                <Route
                    path="/student-batches/"
                    element={<StudentBatchesPage />}
                />
                <Route
                    path="/projects/"
                    element={<ProjectsPage />}
                />
                <Route
                    path="/student-batches/:id"
                    element={<StudentBatchById />}
                />
                <Route
                    path="/projects/:id"
                    element={<ProjectByIdPage />}
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="*" element={<Error404 />} />
            </Routes>
            <Toaster richColors position={'top-right'} />
        </BrowserRouter>
    </ThemeProvider>
)
