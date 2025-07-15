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

const isDev = import.meta.env.DEV;

export const getAuthApiUrl = () => isDev ? '/api/auth' : (window.RUNTIME_CONFIG?.AUTH_API_URL || import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000');

export const getProjectApiUrl = () => isDev ? '/api/project' : (window.RUNTIME_CONFIG?.PROJECT_API_URL || import.meta.env.VITE_PROJECT_API_URL || 'http://localhost:3001');

export const getSubmissionApiUrl = () => isDev ? '/api/submission' : (window.RUNTIME_CONFIG?.SUBMISSION_API_URL || import.meta.env.VITE_SUBMISSION_API_URL || 'http://localhost:3002');
