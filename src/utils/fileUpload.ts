import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { v4 as uuidv4 } from 'uuid'

const accessKeyId =
    window.RUNTIME_CONFIG?.S3_ACCESS_KEY || import.meta.env.VITE_S3_ACCESS_KEY

const secretAccessKey =
    window.RUNTIME_CONFIG?.S3_SECRET_KEY || import.meta.env.VITE_S3_SECRET_KEY

const region = 'eu-west-1' // Set your S3 region here

// Create S3 client with credentials
const s3Client = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
})

export interface S3UploadOptions {
    maxFileSize?: number // in bytes
    allowedFileTypes?: string[]
    bucketName: string
    keyPrefix?: string // prefix for S3 keys (e.g., "uploads/")
}

const DEFAULT_OPTIONS = {
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
}

// Shared validation and upload logic
const validateAndUploadFile = async (
    file: File,
    config: S3UploadOptions & typeof DEFAULT_OPTIONS
) => {
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const s3Key = `${config.keyPrefix}${uniqueFileName}`

    return { s3Key, uniqueFileName }
}

// Shared error handling
const handleS3Error = (error: unknown, bucketName: string) => {
    console.error('S3 upload failed:', error)

    // Provide user-friendly error messages
    if (error instanceof Error) {
        // Check for common AWS errors
        if (error.message.includes('NoSuchBucket')) {
            throw new Error(`S3 bucket "${bucketName}" does not exist`)
        } else if (error.message.includes('AccessDenied')) {
            throw new Error(
                'Access denied. Please check your AWS credentials and permissions.'
            )
        } else if (error.message.includes('InvalidAccessKeyId')) {
            throw new Error(
                'Invalid AWS access key ID. Please check your credentials.'
            )
        } else if (error.message.includes('SignatureDoesNotMatch')) {
            throw new Error(
                'Invalid AWS secret access key. Please check your credentials.'
            )
        }
        throw error
    }

    throw new Error('Failed to upload file to S3. Please try again.')
}

export const createS3PublicUploadFunction = (options: S3UploadOptions) => {
    const config = { ...DEFAULT_OPTIONS, ...options }

    return async (file: File): Promise<string> => {
        try {
            const { s3Key } = await validateAndUploadFile(file, config)

            // Create upload command
            const uploadCommand = new PutObjectCommand({
                // ACL: 'public-read',
                Bucket: config.bucketName,
                Key: s3Key,
                Body: new Uint8Array(await file.arrayBuffer()),
                ContentType: file.type,
            })

            // Upload file to S3
            await s3Client.send(uploadCommand)

            return `https://${config.bucketName}.s3.${region}.amazonaws.com/${s3Key}`
        } catch (error) {
            handleS3Error(error, config.bucketName)
            throw error // This won't be reached but keeps TypeScript happy
        }
    }
}

// Helper function for multipart uploads (for larger files)
export const createS3PublicMultipartUploadFunction = (
    options: S3UploadOptions
) => {
    const config = { ...DEFAULT_OPTIONS, ...options }

    return async (file: File): Promise<string> => {
        try {
            const { s3Key } = await validateAndUploadFile(file, config)

            // Use multipart upload for better handling of larger files
            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: config.bucketName,
                    Key: s3Key,
                    Body: file.stream(),
                    ContentType: file.type,
                    ContentDisposition: 'inline',
                    CacheControl: 'max-age=31536000', // 1 year cache
                },
                queueSize: 4, // optional concurrency configuration
                partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
                leavePartsOnError: false, // optional cleanup incomplete multipart uploads
            })

            // Monitor upload progress (optional)
            upload.on('httpUploadProgress', (progress) => {
                console.log(
                    'Upload progress:',
                    Math.round((progress.loaded! / progress.total!) * 100) + '%'
                )
            })

            await upload.done()

            // Return the public URL
            return `https://${config.bucketName}.s3.${region}.amazonaws.com/${s3Key}`
        } catch (error) {
            handleS3Error(error, config.bucketName)
            throw error
        }
    }
}

// Private upload function that returns S3 URI format
export const createS3UploadFunction = (options: S3UploadOptions) => {
    const config = { ...DEFAULT_OPTIONS, ...options }

    return async (file: File): Promise<string> => {
        try {
            const { s3Key } = await validateAndUploadFile(file, config)

            // Create upload command for private upload (no public-read ACL)
            const uploadCommand = new PutObjectCommand({
                Bucket: config.bucketName,
                Key: s3Key,
                Body: new Uint8Array(await file.arrayBuffer()),
                ContentType: file.type,
            })

            // Upload file to S3
            const response = await s3Client.send(uploadCommand)

            if (response.$metadata.httpStatusCode !== 200) {
                throw new Error('Failed to upload file to S3')
            }

            const responseMetadata = response.$metadata

            console.log(
                `File uploaded successfully to S3. Request ID: ${responseMetadata.requestId}`
            )

            return `s3://${config.bucketName}/${s3Key}`
        } catch (error) {
            handleS3Error(error, config.bucketName)
            throw error
        }
    }
}

export const createS3UploadForReports = () => {
    return createS3PublicUploadFunction({
        maxFileSize: 15 * 1024 * 1024, // 15MB for reports images
        bucketName: 'pamp-reports-images',
    })
}

export const createS3UploadForSyllabus = (projectId: string) => {
    return createS3PublicUploadFunction({
        maxFileSize: 15 * 1024 * 1024, // 15MB for reports images
        bucketName: 'pamp-project-silabus',
        allowedFileTypes: ['application/pdf'],
        keyPrefix: `projects/${projectId}/`,
    })
}

// Parse S3 URI format (s3://bucket/key) to extract bucket and key
const parseS3Uri = (s3Uri: string): { bucket: string; key: string } => {
    if (!s3Uri.startsWith('s3://')) {
        throw new Error('Invalid S3 URI format. Expected s3://bucket/key')
    }

    const uriWithoutProtocol = s3Uri.slice(5) // Remove 's3://'
    const firstSlashIndex = uriWithoutProtocol.indexOf('/')

    if (firstSlashIndex === -1) {
        throw new Error('Invalid S3 URI format. Missing key part')
    }

    const bucket = uriWithoutProtocol.slice(0, firstSlashIndex)
    const key = uriWithoutProtocol.slice(firstSlashIndex + 1)

    return { bucket, key }
}

// Download function for private S3 files
export const downloadS3File = async (
    s3Uri: string,
    filename?: string
): Promise<void> => {
    try {
        const { bucket, key } = parseS3Uri(s3Uri)

        // Get the object from S3
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })

        const response = await s3Client.send(getObjectCommand)

        if (!response.Body) {
            throw new Error('No file data received from S3')
        }

        // Convert the stream to a blob
        const stream = response.Body as ReadableStream
        const reader = stream.getReader()
        const chunks: Uint8Array[] = []

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks.push(value)
        }

        // Combine all chunks into a single Uint8Array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const combinedArray = new Uint8Array(totalLength)
        let offset = 0

        for (const chunk of chunks) {
            combinedArray.set(chunk, offset)
            offset += chunk.length
        }

        // Create blob and trigger download
        const blob = new Blob([combinedArray], {
            type: response.ContentType || 'application/octet-stream',
        })

        // Extract filename from key if not provided
        const downloadFilename = filename || key.split('/').pop() || 'download'

        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = downloadFilename
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error('S3 download failed:', error)

        if (error instanceof Error) {
            // Check for common AWS errors
            if (error.message.includes('NoSuchBucket')) {
                throw new Error('S3 bucket does not exist')
            } else if (error.message.includes('NoSuchKey')) {
                throw new Error('File not found in S3')
            } else if (error.message.includes('AccessDenied')) {
                throw new Error('Access denied. Please check your permissions.')
            } else if (error.message.includes('InvalidAccessKeyId')) {
                throw new Error('Invalid AWS access key ID.')
            } else if (error.message.includes('SignatureDoesNotMatch')) {
                throw new Error('Invalid AWS secret access key.')
            }
            throw error
        }

        throw new Error('Failed to download file from S3. Please try again.')
    }
}

// Unified download handler for submissions
export const handleSubmissionDownload = async (
    link: string,
    linkType: string
) => {
    const { toast } = await import('sonner')

    try {
        if (linkType === 's3' && link.startsWith('s3://')) {
            // Use S3 downloader for private S3 files
            await downloadS3File(link)
            toast.success('File download started')
        } else {
            // For GitHub links or public URLs, open in new window
            window.open(link, '_blank', 'noopener,noreferrer')
        }
    } catch (error) {
        console.error('Download failed:', error)
        toast.error(
            error instanceof Error ? error.message : 'Failed to download file'
        )
    }
}
