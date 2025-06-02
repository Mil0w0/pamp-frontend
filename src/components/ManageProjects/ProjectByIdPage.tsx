import { AppSidebar } from '@/components/app-sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'

export default function ProjectByIdPage() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Project X
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        General settings
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <h1 className="text-2xl">Title: Project X</h1>
                    <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                        <div>
                            <h2 className="text-xl">Description</h2>
                            <p className="text-sm">
                                On the other hand, we denounce with righteous
                                indignation and dislike men who are so beguiled
                                and demoralized by the charms of pleasure of the
                                moment, so blinded by desire, that they cannot
                                foresee the pain and trouble that are bound to
                                ensue; and equal blame belongs to those who fail
                                in their duty through weakness of will, which is
                                the same as saying through shrinking from toil
                                and pain. These cases are perfectly simple and
                                easy to distinguish. In a free hour, when our
                                power of choice is untrammelled and when nothing
                                prevents our being able to do what we like best,
                                every pleasure is to be welcomed and every pain
                                avoided. But in certain circumstances and owing
                                to the claims of duty or the obligations of
                                business it will frequently occur that pleasures
                                have to be repudiated and annoyances accepted.
                                The wise man therefore always holds in these
                                matters to this principle of selection: he
                                rejects pleasures to secure other greater
                                pleasures, or else he endures pains to avoid
                                worse pains.
                            </p>
                        </div>
                        <div className="grid w-full max-w-sm justify-end">
                            <Label htmlFor="studentsExcel">Upload file</Label>
                            <Input id="uploadProject" type="file" />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
