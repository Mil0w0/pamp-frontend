import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

// Get API URL from runtime config or environment
const PROJECT_API_URL =
    window.RUNTIME_CONFIG?.PROJECT_API_URL ||
    import.meta.env.VITE_PROJECT_API_URL ||
    'http://localhost:3001'

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
