import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge.tsx'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

const randomSeed = () => Math.random().toString(36).substring(2, 10)

export default function HomePage({ isTeacher }: { isTeacher?: number }) {
    const [seeds, setSeeds] = useState([
        randomSeed(),
        randomSeed(),
        randomSeed(),
        randomSeed(),
    ])
    const navigate = useNavigate()
    const { currentUser } = useSelector((state: RootState) => state.user)

    useEffect(() => {
        const interval = setInterval(() => {
            setSeeds([randomSeed(), randomSeed(), randomSeed(), randomSeed()])
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const avatarUrl = (seed: string) =>
        `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}`

    const getButtonConfig = () => {
        if (!currentUser) {
            return {
                text: 'Get Started',
                onClick: () => navigate('/login'),
            }
        }

        if (currentUser.role === 'STUDENT') {
            return {
                text: 'Go to Dashboard',
                onClick: () => navigate('/test/student-dashboard'),
            }
        }

        if (currentUser.role === 'TEACHER') {
            return {
                text: 'Manage My Projects',
                onClick: () => navigate('/projects'),
            }
        }

        // Fallback
        return {
            text: 'Get Started',
            onClick: () => navigate('/login'),
        }
    }

    const buttonConfig = getButtonConfig()

    return (
        <div className="flex flex-col md:flex-row min-h-screen items-center justify-center px-6 md:px-12 gap-24">
            <div className="relative flex justify-center md:justify-end w-full md:w-1/2">
                <motion.img
                    key={seeds[0]}
                    src={avatarUrl(seeds[0])}
                    alt="Random Avatar"
                    className="rounded-full w-72 h-72 shadow-xl border border-gray-200 bg-white"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                />

                <div className="absolute -top-6 -left-6 flex flex-col gap-3">
                    {seeds.slice(1).map((seed, index) => (
                        <motion.img
                            key={seed}
                            src={avatarUrl(seed)}
                            alt={`Small Avatar ${index}`}
                            className="rounded-full w-16 h-16 shadow-md border border-gray-200 bg-white"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    ))}
                </div>
            </div>

            <div className="text-center md:text-left w-full md:w-1/2 space-y-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Welcome to PAMP
                    </h1>
                    {(isTeacher !== -1 || currentUser) && (
                        <Badge variant="default">
                            {currentUser?.role === 'TEACHER' || isTeacher === 1
                                ? 'Teacher'
                                : 'Student'}
                        </Badge>
                    )}
                </div>

                <p className="text-lg text-muted-foreground">
                    {currentUser
                        ? `Welcome back, ${currentUser.first_name}! Ready to continue your work?`
                        : 'Manage all your students and projects with our app !'}
                </p>
                <Button
                    size="lg"
                    className="mt-4"
                    onClick={buttonConfig.onClick}
                >
                    {buttonConfig.text}
                </Button>
            </div>
        </div>
    )
}
