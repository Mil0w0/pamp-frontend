import { Outlet } from 'react-router'
export default function CenteredLayout() {
    return (
        <div
            className="main w-svw p-2 flex justify-center items-center"
            style={{ height: '90svh' }}
        >
            <Outlet />
        </div>
    )
}
