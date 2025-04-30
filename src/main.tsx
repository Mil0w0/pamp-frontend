import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LogIn from '@/components/LogIn/LogIn.tsx'
import TeacherRegister from '@/components/Register/TeacherRegister.tsx'
import CenteredLayout from '@/components/layout/CenteredLayout.tsx'
import CustomHeader from '@/components/CustomHeader.tsx'

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <CustomHeader />
        <Routes>
            <Route element={<CenteredLayout />}>
                <Route path="/login" element={<LogIn />} />
                <Route path="/register/teacher" element={<TeacherRegister />} />
            </Route>
            <Route path="/" element={<App />} />
        </Routes>
    </BrowserRouter>
)
