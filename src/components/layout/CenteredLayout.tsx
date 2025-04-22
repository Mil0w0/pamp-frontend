import { Outlet } from 'react-router'

export default function CenteredLayout() {
    return (
        <div className="main h-svh w-svw p-2 flex justify-center items-center">
            <Outlet />
        </div>
    )
}
