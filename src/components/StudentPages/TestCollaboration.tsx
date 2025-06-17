'use client'

import {
    ClientSideSuspense,
    LiveblocksProvider,
    RoomProvider,
} from '@liveblocks/react/suspense'
import { Editor } from './Editor'

export default function TestCollaboration() {
    const apiKey =
        window.RUNTIME_CONFIG?.AUTH_API_URL ||
        import.meta.env.VITE_LIVEBLOCKS_KEY

    if (!apiKey) {
        throw new Error(
            'Please set your Liveblocks public API key in the environment variables.'
        )
    }

    return (
        <LiveblocksProvider publicApiKey={apiKey}>
            <RoomProvider id="my-room">
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                    <Editor />
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}
