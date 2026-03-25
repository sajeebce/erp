export interface UploadParams {
  key: string
  body: Buffer | ReadableStream
  contentType: string
  isPublic?: boolean
}

export interface UploadResult {
  key: string
  url?: string
  size: number
}

export interface StorageObject {
  key: string
  size: number
  lastModified?: Date
}

export interface StorageAdapter {
  upload(params: UploadParams): Promise<UploadResult>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  deleteMany(keys: string[]): Promise<void>
  getUrl(key: string, expiresIn?: number): Promise<string>
  exists(key: string): Promise<boolean>
  list(prefix: string): Promise<StorageObject[]>
  testConnection(): Promise<{ success: boolean; error?: string }>
}
