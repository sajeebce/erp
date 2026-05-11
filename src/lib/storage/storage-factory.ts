import { prisma } from '@/lib/db'
import type { StorageAdapter } from './storage-adapter'
import { LocalStorageAdapter } from './adapters/local-storage'
import { R2StorageAdapter } from './adapters/r2-storage'

let cachedAdapter: StorageAdapter | null = null
let cachedSettingsKey: string | null = null

function buildSettingsKey(settings: { id: string; updatedAt: Date } | null): string {
  if (!settings) return 'local'
  return `${settings.id}:${settings.updatedAt.getTime()}`
}

/**
 * Creates a storage adapter based on MediaSetting configuration.
 * Falls back to local storage if no R2 config is found.
 * Auto-invalidates the cache when MediaSetting has been updated.
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const settings = await prisma.mediaSetting.findFirst({
    where: { isActive: true },
  })

  const key = buildSettingsKey(settings)
  if (cachedAdapter && cachedSettingsKey === key) return cachedAdapter

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

  cachedSettingsKey = key
  return cachedAdapter
}

/**
 * Creates the upload adapter only when Cloudflare R2 is configured.
 * Uploads must not silently fall back to local storage for production documents.
 */
export async function getRequiredUploadStorageAdapter(): Promise<StorageAdapter> {
  const settings = await prisma.mediaSetting.findFirst({
    where: { isActive: true },
  })

  if (
    !settings ||
    settings.provider !== 'cloudflare_r2' ||
    !settings.bucketName ||
    !settings.endpoint ||
    !settings.accessKeyId ||
    !settings.secretAccessKey
  ) {
    throw new Error('Cloudflare R2 storage is not configured. Configure it from Settings > System before uploading files.')
  }

  return getStorageAdapter()
}

/**
 * Invalidate cached adapter (call after MediaSetting update).
 */
export function invalidateStorageCache(): void {
  cachedAdapter = null
  cachedSettingsKey = null
}
