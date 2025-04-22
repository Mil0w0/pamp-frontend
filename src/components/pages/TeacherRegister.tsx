import {cn} from "@/lib/utils.ts";
import {GalleryVerticalEnd} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import React from "react";

function TeacherRegister({ className, ...props }: React.ComponentProps<'div'>){
    return(
        <div
            className={cn('flex flex-col w-1/4 gap-6', className)}
            {...props}
        >
            <form>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <a
                            href="/"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex size-8 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-6" />
                            </div>
                            <span className="sr-only">PAMP</span>
                        </a>
                        <h1 className="text-xl font-bold">
                            Welcome to PAMP.
                        </h1>
                        <div className="text-center text-sm">
                            Already have an account ?{' '}
                            <a
                                href="/login"
                                className="underline underline-offset-4"
                            >
                                Log in
                            </a>
                            <br/>
                            A student account can only be created via the teacher interface.
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="surname">Surname</Label>
                            <Input
                                id="surname"
                                type="text"
                                placeholder="Ex: Hernandez"
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="Ex: Paul"
                                required
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Register
                        </Button>
                    </div>
                </div>
            </form>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our{' '}
                <a href="/termsOfServices">Terms of Service</a> and{' '}
                <a href="/privacyPolicies">Privacy Policy</a>.
            </div>
        </div>
    )
}

export default TeacherRegister;