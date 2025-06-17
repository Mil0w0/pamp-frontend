import { YDocProvider } from '@y-sweet/react'
import { ReactNode } from 'react'

interface YSweetCollaborationProviderProps {
    documentId: string
    children: ReactNode
}

export default function YSweetCollaborationProvider({
    documentId,
    children,
}: YSweetCollaborationProviderProps) {
    return (
        <YDocProvider
            docId={documentId}
            authEndpoint="https://demos.y-sweet.dev/api/auth"
        >
            {children}
        </YDocProvider>
    )
} 