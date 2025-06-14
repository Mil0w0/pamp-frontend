import { useTheme } from '@/components/ui/theme-provider.tsx'
import { useEffect, useState } from 'react'

function CustomHeader() {
    const { theme, setTheme } = useTheme()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [loginLogoutLink, setLoginLogoutLink] = useState(
        !localStorage.getItem('auth_token')
    )

    useEffect(() => {
        setLoginLogoutLink(!loginLogoutLink)
    }, [localStorage.getItem('auth_token')])

    return (
        <header className="bg-sidebar-primary text-sidebar-primary-foreground fixed top-0 left-0 right-0 z-50">
            <nav
                className="mx-auto flex max-w-7xl items-center justify-right p-6 lg:px-8 border-b-1 border-secondary"
                aria-label="Global"
            >
                <div className="flex mr-4">
                    <a href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">PAMP</span>
                        <img
                            className="h-12 w-auto"
                            src="/logo/PAMP-logo@0.5x.png"
                            alt="pamp logo"
                        />
                    </a>
                </div>

                <div className="flex lg:hidden">
                    <button
                        type="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg
                            className="size-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                            data-slot="icon"
                        >
                            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
                <div className="hidden lg:flex justify-items-start lg:gap-x-12">
                    <a href="projects" className="text-sm/6 font-semibold">
                        My projects
                    </a>
                    <a
                        href="/student-batches"
                        className="text-sm/6 font-semibold"
                    >
                        My students batches
                    </a>
                </div>
                <div className="hidden lg:flex lg:flex-1  lg:items-center lg:justify-end">
                    <a
                        href={!loginLogoutLink ? '/login' : '/logout'}
                        className="text-sm/6 font-semibold"
                    >
                        {!loginLogoutLink ? 'Log in' : 'Log out'}{' '}
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                    <div
                        className="flex flex-col justify-center ml-3"
                        onClick={() => {
                            if (theme === 'dark') {
                                return setTheme('light')
                            }
                            return setTheme('dark')
                        }}
                    >
                        <input
                            type="checkbox"
                            name="light-switch"
                            className="light-switch sr-only"
                            checked={theme === 'light'}
                        />
                        <label
                            className="relative cursor-pointer p-2"
                            htmlFor="light-switch"
                        >
                            <svg
                                className="dark:hidden"
                                width="16"
                                height="16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    className="fill-slate-300"
                                    d="M7 0h2v2H7zM12.88 1.637l1.414 1.415-1.415 1.413-1.413-1.414zM14 7h2v2h-2zM12.95 14.433l-1.414-1.413 1.413-1.415 1.415 1.414zM7 14h2v2H7zM2.98 14.364l-1.413-1.415 1.414-1.414 1.414 1.415zM0 7h2v2H0zM3.05 1.706 4.463 3.12 3.05 4.535 1.636 3.12z"
                                />
                                <path
                                    className="fill-slate-400"
                                    d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4Z"
                                />
                            </svg>
                            <svg
                                className="hidden dark:block"
                                width="16"
                                height="16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    className="fill-slate-400"
                                    d="M6.2 1C3.2 1.8 1 4.6 1 7.9 1 11.8 4.2 15 8.1 15c3.3 0 6-2.2 6.9-5.2C9.7 11.2 4.8 6.3 6.2 1Z"
                                />
                                <path
                                    className="fill-slate-500"
                                    d="M12.5 5a.625.625 0 0 1-.625-.625 1.252 1.252 0 0 0-1.25-1.25.625.625 0 1 1 0-1.25 1.252 1.252 0 0 0 1.25-1.25.625.625 0 1 1 1.25 0c.001.69.56 1.249 1.25 1.25a.625.625 0 1 1 0 1.25c-.69.001-1.249.56-1.25 1.25A.625.625 0 0 1 12.5 5Z"
                                />
                            </svg>
                            <span className="sr-only">
                                Switch to light / dark version
                            </span>
                        </label>
                    </div>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 z-10"></div>
                    <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-sidebar-primary px-6 py-6 dark:sm:ring-white sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                        <div className="flex items-center justify-between">
                            <a href="/" className="-m-1.5 p-1.5">
                                <span className="sr-only">PAMP</span>
                                <img
                                    className="h-8 w-auto"
                                    src="/logo/PAMP-logo@0.5x.png"
                                    alt=""
                                />
                            </a>
                            <button
                                type="button"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                            >
                                <span className="sr-only">Close menu</span>
                                <svg
                                    className="size-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                    data-slot="icon"
                                >
                                    <path d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10">
                                <div className="space-y-2 py-6">
                                    <a
                                        href="/student-batches"
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-gray-50"
                                    >
                                        My student batches
                                    </a>
                                    <a
                                        href="/projects"
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold hover:bg-gray-50"
                                    >
                                        My projects
                                    </a>
                                </div>
                                <div className="py-6">
                                    <a
                                        href={
                                            !loginLogoutLink
                                                ? '/login'
                                                : '/logout'
                                        }
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold hover:bg-gray-50"
                                    >
                                        {!loginLogoutLink
                                            ? 'Log in'
                                            : 'Log out'}
                                    </a>
                                    <div
                                        className="flex flex-col justify-center mt-4"
                                        onClick={() => {
                                            if (theme === 'dark') {
                                                return setTheme('light')
                                            }
                                            return setTheme('dark')
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            name="light-switch-mobile"
                                            className="light-switch sr-only"
                                            checked={theme === 'light'}
                                        />
                                        <label
                                            className="relative cursor-pointer p-2"
                                            htmlFor="light-switch-mobile"
                                        >
                                            <svg
                                                className="dark:hidden"
                                                width="16"
                                                height="16"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    className="fill-slate-300"
                                                    d="M7 0h2v2H7zM12.88 1.637l1.414 1.415-1.415 1.413-1.413-1.414zM14 7h2v2h-2zM12.95 14.433l-1.414-1.413 1.413-1.415 1.415 1.414zM7 14h2v2H7zM2.98 14.364l-1.413-1.415 1.414-1.414 1.414 1.415zM0 7h2v2H0zM3.05 1.706 4.463 3.12 3.05 4.535 1.636 3.12z"
                                                />
                                                <path
                                                    className="fill-slate-400"
                                                    d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4Z"
                                                />
                                            </svg>
                                            <svg
                                                className="hidden dark:block"
                                                width="16"
                                                height="16"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    className="fill-slate-400"
                                                    d="M6.2 1C3.2 1.8 1 4.6 1 7.9 1 11.8 4.2 15 8.1 15c3.3 0 6-2.2 6.9-5.2C9.7 11.2 4.8 6.3 6.2 1Z"
                                                />
                                                <path
                                                    className="fill-slate-500"
                                                    d="M12.5 5a.625.625 0 0 1-.625-.625 1.252 1.252 0 0 0-1.25-1.25.625.625 0 1 1 0-1.25 1.252 1.252 0 0 0 1.25-1.25.625.625 0 1 1 1.25 0c.001.69.56 1.249 1.25 1.25a.625.625 0 1 1 0 1.25c-.69.001-1.249.56-1.25 1.25A.625.625 0 0 1 12.5 5Z"
                                                />
                                            </svg>
                                            <span className="sr-only">
                                                Switch to light / dark version
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default CustomHeader
