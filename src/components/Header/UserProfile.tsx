import { User } from '@/services/UserService/types.ts'

export default function UserProfile({ user }: { user: User }) {
    if (!user) return 'No data'
    return (
        <div className=" flex flex-col p-2 gap-2">
            <p>
                <span className="font-semibold">Your email:</span> {user.email}
            </p>
            <p>
                <span className="font-semibold">Your name: </span>
                {user.first_name + ' ' + user.last_name}{' '}
            </p>
            <p>
                <span className="font-semibold">You are a</span> {user.role}
            </p>
        </div>
    )
}
