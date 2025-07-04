declare global {
    interface Window {
        RUNTIME_CONFIG?: {
            AUTH_API_URL?: string
            PROJECT_API_URL?: string
            SUBMISSION_API_URL?: string
            LIVEBLOCKS_KEY?: string
            S3_ACCESS_KEY?: string
            S3_SECRET_KEY?: string
        }
    }
}
