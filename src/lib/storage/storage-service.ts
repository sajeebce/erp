import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { getRequiredUploadStorageAdapter, getStorageAdapter } from './storage-factory'

interface UploadFileParams {
  organizationId: string
  module: string // e.g., "finance", "hr", "procurement"
  entityType: string // e.g., "voucher", "employee"
  entityId: string
  fileName: string
  fileBuffer: Buffer
  mimeType: string
  uploadedById: string
}

interface UploadedFile {
  id: string
  storageKey: string
  originalName: string
  fileSize: number
  mimeType: string
  url?: string
}

/**
 * Upload a file with tenant namespace and quota check.
 * Key format: {orgId}/{module}/{year}/{month}/{uuid}-{filename}
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadedFile> {
  // 1. Check storage quota
  await checkStorageQuota(params.organizationId, params.fileBuffer.length)

  // 2. Check file size limit
  const mediaSetting = await prisma.mediaSetting.findFirst({ where: { isActive: true } })
  const maxSizeMb = mediaSetting?.maxFileSizeMb ?? 50
  const fileSizeMb = params.fileBuffer.length / (1024 * 1024)
  if (fileSizeMb > maxSizeMb) {
    throw new Error(`File size ${fileSizeMb.toFixed(1)}MB exceeds maximum ${maxSizeMb}MB`)
  }

  // 3. Generate storage key
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = randomUUID()
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageKey = `${params.organizationId}/${params.module}/${year}/${month}/${uuid}-${safeName}`

  // 4. Upload via adapter
  const adapter = await getRequiredUploadStorageAdapter()
  const result = await adapter.upload({
    key: storageKey,
    body: params.fileBuffer,
    contentType: params.mimeType,
  })

  // 5. Create attachment record
  const attachment = await prisma.attachment.create({
    data: {
      fileName: `${uuid}-${safeName}`,
      originalName: params.fileName,
      storageKey,
      fileSize: result.size,
      mimeType: params.mimeType,
      entityType: params.entityType,
      entityId: params.entityId,
      uploadedById: params.uploadedById,
    },
  })

  // 6. Increment storage usage
  await incrementStorageUsage(params.organizationId, result.size)

  return {
    id: attachment.id,
    storageKey,
    originalName: params.fileName,
    fileSize: result.size,
    mimeType: params.mimeType,
    url: result.url,
  }
}

/**
 * Delete a file and decrement storage usage.
 */
export async function deleteFile(attachmentId: string, organizationId: string): Promise<void> {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment) return

  const adapter = await getStorageAdapter()
  await adapter.delete(attachment.storageKey)

  await prisma.attachment.delete({ where: { id: attachmentId } })

  // Decrement storage
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      storageUsedBytes: {
        decrement: BigInt(attachment.fileSize),
      },
    },
  })
}

/**
 * Get download URL for a file.
 */
export async function getFileUrl(storageKey: string): Promise<string> {
  const adapter = await getStorageAdapter()
  return adapter.getUrl(storageKey)
}

// ─── Storage Quota ───

async function checkStorageQuota(organizationId: string, additionalBytes: number): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  })

  if (!org?.subscription?.plan) return

  const limitBytes = BigInt(org.subscription.plan.storageGb) * BigInt(1024 * 1024 * 1024)
  const usedAfter = org.storageUsedBytes + BigInt(additionalBytes)

  if (usedAfter > limitBytes) {
    const usedGb = Number(org.storageUsedBytes) / (1024 * 1024 * 1024)
    const limitGb = org.subscription.plan.storageGb
    throw new Error(
      `Storage quota exceeded. Used: ${usedGb.toFixed(2)}GB / ${limitGb}GB. Upgrade your plan.`
    )
  }
}

async function incrementStorageUsage(organizationId: string, bytes: number): Promise<void> {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      storageUsedBytes: { increment: BigInt(bytes) },
    },
    include: {
      subscription: { include: { plan: true } },
    },
  })

  if (!org.subscription?.plan) return

  const limitBytes = BigInt(org.subscription.plan.storageGb) * BigInt(1024 * 1024 * 1024)
  const usagePercent = Number(org.storageUsedBytes * BigInt(100) / limitBytes)

  // Send warnings at 80% and 90%
  if (usagePercent >= 90 && !org.storageWarning90Sent) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { storageWarning90Sent: true },
    })
    // TODO: Send email notification
  } else if (usagePercent >= 80 && !org.storageWarning80Sent) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { storageWarning80Sent: true },
    })
    // TODO: Send email notification
  }
}
