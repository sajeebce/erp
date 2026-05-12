import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import type { StorageAdapter, UploadParams, UploadResult, StorageObject } from '../storage-adapter'

interface R2Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  region?: string
  publicUrl?: string
}

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client
  private bucket: string
  private publicUrl?: string

  constructor(config: R2Config) {
    // Strip any trailing slash or accidental "/bucketName" suffix users sometimes paste
    let endpoint = config.endpoint.trim().replace(/\/+$/, '')
    const trailingBucket = `/${config.bucketName}`
    if (endpoint.toLowerCase().endsWith(trailingBucket.toLowerCase())) {
      endpoint = endpoint.slice(0, -trailingBucket.length)
    }

    this.client = new S3Client({
      endpoint,
      region: config.region || 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
    this.bucket = config.bucketName
    this.publicUrl = config.publicUrl?.replace(/\/+$/, '')
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const buffer = params.body instanceof Buffer
      ? params.body
      : Buffer.from(await new Response(params.body as ReadableStream).arrayBuffer())

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: buffer,
        ContentType: params.contentType,
      })
    )

    return {
      key: params.key,
      url: this.publicUrl ? `${this.publicUrl}/${params.key}` : undefined,
      size: buffer.length,
    }
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    )
    const stream = response.Body as ReadableStream
    return Buffer.from(await new Response(stream).arrayBuffer())
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    )
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return

    // S3 DeleteObjects supports max 1000 keys per request
    const batches = []
    for (let i = 0; i < keys.length; i += 1000) {
      batches.push(keys.slice(i, i + 1000))
    }

    for (const batch of batches) {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
          },
        })
      )
    }
  }

  async getUrl(key: string): Promise<string> {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }
    return `${this.bucket}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      )
      return true
    } catch {
      return false
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      })
    )

    return (response.Contents || []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }))
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testKey = '.connection-test'
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
          Body: Buffer.from('test'),
          ContentType: 'text/plain',
        })
      )
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: testKey })
      )
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
