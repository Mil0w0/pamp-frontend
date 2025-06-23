import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
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

export const createS3UploadFunction = (options: S3UploadOptions) => {
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

            // Generate unique filename
            const fileExtension = file.name.split('.').pop() || ''
            const uniqueFileName = `${uuidv4()}.${fileExtension}`
            const s3Key = `${config.keyPrefix}${uniqueFileName}`

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
            console.error('S3 upload failed:', error)

            // Provide user-friendly error messages
            if (error instanceof Error) {
                // Check for common AWS errors
                if (error.message.includes('NoSuchBucket')) {
                    throw new Error(
                        `S3 bucket "${config.bucketName}" does not exist`
                    )
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
    }
}

// Helper function for multipart uploads (for larger files)
export const createS3MultipartUploadFunction = (options: S3UploadOptions) => {
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

            // Generate unique filename
            const fileExtension = file.name.split('.').pop() || ''
            const uniqueFileName = `${uuidv4()}.${fileExtension}`
            const s3Key = `${config.keyPrefix}${uniqueFileName}`

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
            console.error('S3 multipart upload failed:', error)

            if (error instanceof Error) {
                if (error.message.includes('NoSuchBucket')) {
                    throw new Error(
                        `S3 bucket "${config.bucketName}" does not exist`
                    )
                } else if (error.message.includes('AccessDenied')) {
                    throw new Error(
                        'Access denied. Please check your AWS credentials and permissions.'
                    )
                }
                throw error
            }

            throw new Error('Failed to upload file to S3. Please try again.')
        }
    }
}

export const createS3UploadForReports = () => {
    return createS3UploadFunction({
        maxFileSize: 15 * 1024 * 1024, // 15MB for reports images
        bucketName: 'pamp-reports-images',
    })
}
