// File upload utility for BlockNote editor
// This handles image, video, and audio file uploads

export interface UploadOptions {
    maxFileSize?: number // in bytes
    allowedFileTypes?: string[]
    uploadEndpoint?: string
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'application/pdf',
    ],
    uploadEndpoint: 'https://tmpfiles.org/api/v1/upload',
}

export const createUploadFunction = (options: UploadOptions = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options }

    return async (file: File): Promise<string> => {
        try {
            // Validate file size
            if (file.size > config.maxFileSize) {
                throw new Error(
                    `File size exceeds ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB limit`
                )
            }

            // Validate file type
            if (!config.allowedFileTypes.includes(file.type)) {
                throw new Error(`File type ${file.type} is not allowed`)
            }

            // Create FormData
            const formData = new FormData()
            formData.append('file', file)

            // Upload file
            const response = await fetch(config.uploadEndpoint, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`)
            }

            const data = await response.json()

            // Handle tmpfiles.org response format
            if (config.uploadEndpoint.includes('tmpfiles.org')) {
                return data.data.url.replace(
                    'tmpfiles.org/',
                    'tmpfiles.org/dl/'
                )
            }

            // For custom backends, adjust this based on your API response format
            return data.url || data.data?.url || data.downloadUrl
        } catch (error) {
            console.error('File upload failed:', error)

            // Provide user-friendly error messages
            if (error instanceof Error) {
                throw error
            }

            throw new Error('Failed to upload file. Please try again.')
        }
    }
}

// Default upload function using tmpfiles.org
export const defaultUploadFile = createUploadFunction()

// Upload function for your own backend (example)
export const createCustomUploadFunction = (apiEndpoint: string) => {
    return createUploadFunction({
        uploadEndpoint: apiEndpoint,
        maxFileSize: 20 * 1024 * 1024, // 20MB for custom backend
    })
}
