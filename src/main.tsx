import { createRoot } from 'react-dom/client'
import './index.css'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import '@liveblocks/react-ui/styles.css'
import '@liveblocks/react-ui/styles/dark/media-query.css'
import '@liveblocks/react-blocknote/styles.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LogIn from '@/components/LogIn/LogIn.tsx'
import TeacherRegister from '@/components/Register/TeacherRegister.tsx'
import CenteredLayout from '@/components/layout/CenteredLayout.tsx'
import CustomHeader from '@/components/Header/CustomHeader.tsx'
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
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'
import ProjectGroupsById from '@/components/ProjectPages/ProjectGroups/ProjectGroupsById.tsx'
import ProjectByIdPageStepConfig from '@/components/ProjectPages/ProjectByIdPageStepsConfig.tsx'
import ProtectedRoute from '@/components/Routes/ProtectedRoutes.tsx'
import ProjectByIdPageReportDefinition from '@/components/ProjectPages/ProjectByIdPageReportDefinition.tsx'
import TeacherReviewReport from '@/components/TeacherPages/TeacherReviewReport.tsx'
import StudentDashboard from '@/components/StudentPages/StudentDashboard.tsx'
import { StudentReport } from '@/components/StudentPages'
import { StepById } from '@/components/ProjectPages/Steps/StepById.tsx'
import ProjectByIdOralsPlanning from '@/components/ProjectPages/OralsPlanning/ProjectByIdOralsPlanning.tsx'
import { GradingSystemDemo } from './components/GradingSystem/GradingSystemDemo.tsx'
import ProjectGradingPage from '@/components/ProjectPages/ProjectGradingPage.tsx'

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <BrowserRouter>
                    <CustomHeader />
                    <Routes>
                        {/* Auth & Main Entry */}
                        <Route element={<CenteredLayout />}>
                            <Route path="/login" element={<LogIn />} />
                            <Route
                                path="/register/teacher"
                                element={<TeacherRegister />}
                            />
                            <Route path="/" element={<App />} />
                        </Route>

                        {/* Student batches (list & detail) */}
                        <Route
                            path="/student-batches"
                            element={
                                <ProtectedRoute allowedRoles={['TEACHER']}>
                                    <StudentBatchesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student-batches/:id"
                            element={<StudentBatchById />}
                        />

                        {/* Projects list */}
                        <Route
                            path="/projects"
                            element={
                                <ProtectedRoute
                                    allowedRoles={['TEACHER', 'STUDENT']}
                                >
                                    <ProjectsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Auth callback, logout */}
                        <Route
                            path="/auth/callback"
                            element={<AuthCallback />}
                        />
                        <Route path="/logout" element={<Logout />} />

                        {/* Project detail routes with sidebar */}
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
                                path="steps/:stepId"
                                element={<StepById />}
                            />
                            <Route
                                path="test/classic-review"
                                element={<TeacherReviewReport />}
                            />
                            <Route
                                path="report-definition"
                                element={<ProjectByIdPageReportDefinition />}
                            />
                            <Route
                                path="orals"
                                element={<ProjectByIdOralsPlanning />}
                            />
                            {/* AJOUT : Route pour la grille de notation */}
                            <Route
                                path="grading"
                                element={<ProjectGradingPage />}
                            />
                            <Route path="*" element={<Error404 />} />
                        </Route>

                        {/* Grading page (global) */}
                        <Route
                            path="/grading"
                            element={
                                <ProtectedRoute allowedRoles={['TEACHER']}>
                                    <ProjectGradingPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Student dashboard & report */}
                        <Route
                            path="/test/student-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/dashboard"
                            element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/report/:projectId/:groupId"
                            element={
                                <ProtectedRoute allowedRoles={['STUDENT']}>
                                    <StudentReport />
                                </ProtectedRoute>
                            }
                        />

                        {/* Teacher review page */}
                        <Route
                            path="/teacher/review/:projectId/:groupId"
                            element={
                                <ProtectedRoute allowedRoles={['TEACHER']}>
                                    <TeacherReviewReport />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/projects/ProjectGradingPage"
                            element={
                                <ProtectedRoute allowedRoles={['TEACHER']}>
                                    <GradingSystemDemo
                                        projectId={'projectId'}
                                    />
                                </ProtectedRoute>
                            }
                        />

                        {/* 404 fallback */}
                        <Route path="*" element={<Error404 />} />
                    </Routes>
                    <Toaster richColors position={'top-right'} />
                </BrowserRouter>
            </ThemeProvider>
        </PersistGate>
    </Provider>
)
