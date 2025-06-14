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
import ProjectsPage from '@/components/ManageProjects/ProjectsPage.tsx'
import SidebarLayout from '@/components/layout/SidebarLayout.tsx'
import ProjectByIdPageGeneral from '@/components/ProjectPages/ProjectByIdPageGeneral.tsx'
import ProjectByIdPageGroupConfig from '@/components/ProjectPages/ProjectByIdPageGroupConfig.tsx'
import { Provider } from 'react-redux'
import { store } from '@/store'
import ProjectGroupsById from '@/components/ProjectPages/ProjectGroups/ProjectGroupsById.tsx'
import ProjectByIdPageStepConfig from '@/components/ProjectPages/ProjectByIdPageStepsConfig.tsx'
import ProtectedRoute from '@/components/Routes/ProtectedRoutes.tsx'
import ProjectByIdPageReportDefinition from '@/components/ProjectPages/ProjectByIdPageReportDefinition.tsx'
import StudentReportClassic from '@/components/StudentPages/StudentReportClassic.tsx'
import StudentReportQuestionnaire from '@/components/StudentPages/StudentReportQuestionnaire.tsx'

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
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
                        element={
                            <ProtectedRoute allowedRoles={['TEACHER']}>
                                <StudentBatchesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/projects/"
                        element={
                            <ProtectedRoute
                                allowedRoles={['TEACHER', 'STUDENT']}
                            >
                                <ProjectsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student-batches/:id"
                        element={<StudentBatchById />}
                    />

                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/logout" element={<Logout />} />

                    <Route
                        path="/projects/:projectId/*"
                        element={<SidebarLayout />}
                    >
                        <Route
                            path="settings"
                            element={<ProjectByIdPageGeneral />}
                        />
                        <Route
                            path="groups"
                            element={<ProjectByIdPageGroupConfig />}
                        />
                        <Route
                            path="groups/:groupId"
                            element={<ProjectGroupsById />}
                        />
                        <Route
                            path="steps/config"
                            element={<ProjectByIdPageStepConfig />}
                        />
                        <Route
                            path="steps/:stepId/"
                            element={<ProjectByIdPageStepConfig />}
                        />
                        <Route path="*" element={<Error404 />} />
                        <Route
                            path="report-definition"
                            element={<ProjectByIdPageReportDefinition />}
                        />
                    </Route>
                    <Route
                        path="test/classic-report"
                        element={<StudentReportClassic />}
                    />
                    <Route
                        path="test/questionnaire-report"
                        element={<StudentReportQuestionnaire />}
                    />

                    <Route path="*" element={<Error404 />} />
                </Routes>
                <Toaster richColors position={'top-right'} />
            </BrowserRouter>
        </ThemeProvider>
    </Provider>
)
