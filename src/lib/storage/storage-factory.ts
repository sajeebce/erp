import { prisma } from '@/lib/db'
import type { StorageAdapter } from './storage-adapter'
import { LocalStorageAdapter } from './adapters/local-storage'
import { R2StorageAdapter } from './adapters/r2-storage'

let cachedAdapter: StorageAdapter | null = null

/**
 * Creates a storage adapter based on MediaSetting configuration.
 * Falls back to local storage if no R2 config is found.
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (cachedAdapter) return cachedAdapter

  const settings = await prisma.mediaSetting.findFirst({
    where: { isActive: true },
  })

  if (settings && settings.provider === 'cloudflare_r2' && settings.accessKeyId && settings.secretAccessKey) {
    cachedAdapter = new R2StorageAdapter({
      endpoint: settings.endpoint,
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
      bucketName: settings.bucketName,
      region: settings.region || 'auto',
      publicUrl: settings.publicUrl || undefined,
    })
  } else {
    cachedAdapter = new LocalStorageAdapter()
  }

  return cachedAdapter
}

/**
 * Invalidate cached adapter (call after MediaSetting update).
 */
export function invalidateStorageCache(): void {
  cachedAdapter = null
}
