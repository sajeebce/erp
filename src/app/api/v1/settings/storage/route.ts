import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

function maskSecret(secret: string): string {
  if (secret.length <= 4) return '****'
  return '*'.repeat(secret.length - 4) + secret.slice(-4)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const settings = await prisma.mediaSetting.findFirst({
      where: { isActive: true },
    })

    // Fetch org storage usage
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        storageUsedBytes: true,
      },
    })

    // Fetch plan storage limit
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { organizationId: auth.organizationId },
      include: { plan: { select: { storageGb: true } } },
    })

    return apiSuccess({
      configured: !!settings,
      provider: settings?.provider || null,
      bucketName: settings?.bucketName || null,
      region: settings?.region || null,
      endpoint: settings?.endpoint || null,
      accessKeyId: settings ? maskSecret(settings.accessKeyId) : null,
      publicUrl: settings?.publicUrl || null,
      maxFileSizeMb: settings?.maxFileSizeMb || 50,
      allowedMimeTypes: settings?.allowedMimeTypes || '',
      storageUsedBytes: org?.storageUsedBytes ? Number(org.storageUsedBytes) : 0,
      storageLimitGb: subscription?.plan?.storageGb || 5,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
