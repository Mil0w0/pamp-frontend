import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

// Get API URLs from runtime config or environment
const PROJECT_API_URL =
    window.RUNTIME_CONFIG?.PROJECT_API_URL ||
    import.meta.env.VITE_PROJECT_API_URL ||
    'http://localhost:3001'

const AUTH_API_URL =
    window.RUNTIME_CONFIG?.AUTH_API_URL ||
    import.meta.env.VITE_AUTH_API_URL ||
    'http://localhost:3000'

// Define UserDTO interface to match the AUTH_API response
interface UserDTO {
    user_id: string
    email: string
    first_name: string
    last_name: string
    role: 'TEACHER' | 'STUDENT'
    is_active: boolean
}

// Function to fetch users from AUTH_API
async function fetchUsers(userIds: string[]): Promise<UserDTO[]> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
        console.warn('No auth token found for user resolution')
        return []
    }

    try {
        const idsParam = userIds.join(',')
        const response = await fetch(`${AUTH_API_URL}/users?ids=${idsParam}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.error(
                'Failed to fetch users:',
                response.status,
                response.statusText
            )
            return []
        }

        const users: UserDTO[] = await response.json()
        console.log(`Resolved ${users.length} users from AUTH_API`)
        return users
    } catch (error) {
        console.error('Error fetching users:', error)
        return []
    }
}

const client = createClient({
    authEndpoint: async (room) => {
        // Extract projectId and groupId from room name
        // Expected format: "project-{projectId}-group-{groupId}-report"
        if (!room) {
            throw new Error('Room name is required')
        }

        // Parse room ID by working from both ends
        if (!room.startsWith('project-') || !room.endsWith('-report')) {
            console.error('Invalid room format:', room)
            throw new Error(
                'Invalid room format. Expected: project-{projectId}-group-{groupId}-report'
            )
        }

        // Remove "project-" prefix and "-report" suffix
        const middle = room.slice(8, -7) // Remove "project-" (8 chars) and "-report" (7 chars)

        // Find the last occurrence of "-group-" to split projectId and groupId
        const groupIndex = middle.lastIndexOf('-group-')
        if (groupIndex === -1) {
            console.error(
                'Invalid room format - missing group separator:',
                room
            )
            throw new Error(
                'Invalid room format. Expected: project-{projectId}-group-{groupId}-report'
            )
        }

        const projectId = middle.slice(0, groupIndex)
        const groupId = middle.slice(groupIndex + 7) // Skip "-group-" (7 chars)

        console.log('Parsed room:', { room, projectId, groupId })

        // Get auth token from localStorage
        const token = localStorage.getItem('auth_token')
        console.log(
            'Auth token found:',
            token ? 'Yes (length: ' + token.length + ')' : 'No'
        )
        console.log(
            'Token preview:',
            token ? token.substring(0, 50) + '...' : 'N/A'
        )

        if (!token) {
            throw new Error('No authentication token found')
        }

        console.log('Making request to:', `${PROJECT_API_URL}/liveblocks/auth`)
        console.log('Request body:', { projectId, groupId })

        const response = await fetch(`${PROJECT_API_URL}/liveblocks/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                projectId,
                groupId,
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Backend auth error:', error)
            throw new Error(`Failed to authenticate: ${error}`)
        }

        const { token: accessToken } = await response.json()
        console.log('Liveblocks access token received successfully')
        return { token: accessToken }
    },
    resolveUsers: async ({ userIds }) => {
        console.log('Resolving users for IDs:', userIds)

        const users = await fetchUsers(userIds)

        // Transform UserDTO to Liveblocks user info format - return array in same order as userIds
        const resolvedUsers = userIds.map((userId) => {
            const user = users.find((u) => u.user_id === userId)

            if (user) {
                return {
                    name: `${user.first_name} ${user.last_name}`,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=random`,
                }
            } else {
                // Return undefined for users that couldn't be resolved
                return undefined
            }
        })

        console.log('Resolved users:', resolvedUsers)
        return resolvedUsers
    },
})

export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useOthers,
    useBroadcastEvent,
    useEventListener,
    useStorage,
    useMutation,
    useThreads,
    useUser,
    useCreateThread,
} = createRoomContext(client)

export { client }
