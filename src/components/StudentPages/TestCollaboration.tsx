import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useYDoc, useYjsProvider, YDocProvider } from '@y-sweet/react'
import { useState } from 'react'

export default function TestCollaboration() {
    const docId = 'test-collaboration-document'

    return (
        <YDocProvider
            docId={docId}
            authEndpoint="https://demos.y-sweet.dev/api/auth"
        >
            <CollaborativeDocument />
        </YDocProvider>
    )
}

function CollaborativeDocument() {
    const provider = useYjsProvider()
    const doc = useYDoc()
    const [connectedUsers, setConnectedUsers] = useState(0)

    // Monitor awareness for user count
    useState(() => {
        if (provider?.awareness) {
            const updateUserCount = () => {
                const users = provider.awareness.getStates().size
                setConnectedUsers(users)
                console.log('Connected users:', users)
            }

            provider.awareness.on('change', updateUserCount)
            updateUserCount() // Initial count

            return () => {
                provider.awareness.off('change', updateUserCount)
            }
        }
    })

    const editor = useCreateBlockNote({
        initialContent: [
            {
                type: 'paragraph',
                content: 'Start typing here to test Y-Sweet collaboration...',
            },
            {
                type: 'paragraph',
                content:
                    'Open this page in multiple tabs or browsers to see real-time collaboration!',
            },
        ],
        collaboration: {
            provider,
            fragment: doc.getXmlFragment('blocknote'),
            user: {
                name: 'User ' + Math.floor(Math.random() * 100),
                color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            },
            showCursorLabels: 'activity',
        },
    })

    return (
        <div className="p-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">
                    Y-Sweet Collaboration Test
                </h1>
                <p className="text-sm text-muted-foreground">
                    Connected users: {connectedUsers} | Provider:{' '}
                    {provider ? 'Connected' : 'Connecting...'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    ✅ Using Y-Sweet hosted backend for reliable collaboration
                </p>
                <p className="text-xs text-muted-foreground">
                    🔄 Open this page in multiple tabs/browsers to test
                    real-time editing
                </p>
            </div>

            <div className="border rounded-lg">
                <BlockNoteView editor={editor} />
            </div>
        </div>
    )
}
