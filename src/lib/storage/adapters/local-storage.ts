import fs from 'fs/promises'
import path from 'path'
import type { StorageAdapter, UploadParams, UploadResult, StorageObject } from '../storage-adapter'

const STORAGE_ROOT = path.join(process.cwd(), 'storage')

export class LocalStorageAdapter implements StorageAdapter {
  async upload(params: UploadParams): Promise<UploadResult> {
    const filePath = path.join(STORAGE_ROOT, params.key)
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })

    const buffer = params.body instanceof Buffer
      ? params.body
      : Buffer.from(await new Response(params.body as ReadableStream).arrayBuffer())

    await fs.writeFile(filePath, buffer)

    return {
      key: params.key,
      size: buffer.length,
    }
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(STORAGE_ROOT, key)
    return fs.readFile(filePath)
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(STORAGE_ROOT, key)
    await fs.unlink(filePath).catch(() => {})
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)))
  }

  async getUrl(key: string): Promise<string> {
    return `/storage/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(STORAGE_ROOT, key)
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const dirPath = path.join(STORAGE_ROOT, prefix)
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const objects: StorageObject[] = []
      for (const entry of entries) {
        if (entry.isFile()) {
          const stat = await fs.stat(path.join(dirPath, entry.name))
          objects.push({
            key: `${prefix}/${entry.name}`,
            size: stat.size,
            lastModified: stat.mtime,
          })
        }
      }
      return objects
    } catch {
      return []
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.mkdir(STORAGE_ROOT, { recursive: true })
      const testFile = path.join(STORAGE_ROOT, '.connection-test')
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}
