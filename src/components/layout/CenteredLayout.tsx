import { Outlet } from 'react-router'
import { Toaster } from 'sonner'

export default function CenteredLayout() {
    return (
        <div className="main h-svh w-svw p-2 flex justify-center items-center">
            <Outlet />
            <Toaster richColors position={'top-right'} />
        </div>
    )
}
