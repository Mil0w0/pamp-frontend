import { useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon } from 'lucide-react'

interface CollapsibleSidebarLayoutProps {
    children: ReactNode
    sidebarContent: ReactNode
    sidebarTitle?: string
    defaultOpen?: boolean
    className?: string
}

export default function SplitCollapsibleRightLayout({
    children,
    sidebarContent,
    sidebarTitle = 'Guide',
    defaultOpen = true,
    className = '',
}: CollapsibleSidebarLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(defaultOpen)

    return (
        <div className={`relative ${className}`}>
            {/* Main Content */}
            <div
                className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pr-120' : ''}`}
            >
                {children}
            </div>

            {/* Collapsible Right Sidebar */}
            <div
                className={`fixed top-[95px] right-0 h-[calc(100vh-6rem)] bg-background border-l transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} w-120 z-30`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-background">
                        <div className="flex items-center gap-2">
                            <InfoIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{sidebarTitle}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSidebarOpen(false)}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {sidebarContent}
                    </div>
                </div>
            </div>

            {/* Toggle Button for Collapsed Sidebar */}
            {!isSidebarOpen && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed top-28 right-4 z-40 h-10 w-10 p-0 shadow-lg bg-background border-2"
                    title={`Open ${sidebarTitle}`}
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </Button>
            )}

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    )
}
