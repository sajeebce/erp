import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

function maskSecret(secret: string): string {
  if (secret.length <= 4) return '****'
  return '*'.repeat(secret.length - 4) + secret.slice(-4)
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const settings = await prisma.mediaSetting.findFirst()

    if (!settings) {
      return apiNotFound('No media settings configured')
    }

    return apiSuccess({
      id: settings.id,
      provider: settings.provider,
      bucketName: settings.bucketName,
      region: settings.region,
      endpoint: settings.endpoint,
      accessKeyId: settings.accessKeyId,
      secretAccessKey: maskSecret(settings.secretAccessKey),
      publicUrl: settings.publicUrl,
      maxFileSizeMb: settings.maxFileSizeMb,
      allowedMimeTypes: settings.allowedMimeTypes,
      isActive: settings.isActive,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const body = await request.json()
    const {
      provider,
      bucketName,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicUrl,
      maxFileSizeMb,
      allowedMimeTypes,
    } = body

    if (!provider || !bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
      return apiBadRequest('provider, bucketName, endpoint, accessKeyId, and secretAccessKey are required')
    }

    if (maxFileSizeMb !== undefined && (typeof maxFileSizeMb !== 'number' || maxFileSizeMb < 1)) {
      return apiBadRequest('maxFileSizeMb must be a positive number')
    }

    const existing = await prisma.mediaSetting.findFirst()

    const data = {
      provider,
      bucketName,
      region: region || null,
      endpoint,
      accessKeyId,
      secretAccessKey,
      publicUrl: publicUrl || null,
      maxFileSizeMb: maxFileSizeMb || 50,
      allowedMimeTypes: allowedMimeTypes || 'image/*,application/pdf',
    }

    let settings
    if (existing) {
      settings = await prisma.mediaSetting.update({
        where: { id: existing.id },
        data,
      })
    } else {
      settings = await prisma.mediaSetting.create({ data })
    }

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: existing ? 'UPDATE_MEDIA_SETTINGS' : 'CREATE_MEDIA_SETTINGS',
        entityType: 'MediaSetting',
        entityId: settings.id,
        details: {
          provider: settings.provider,
          bucketName: settings.bucketName,
          region: settings.region,
          endpoint: settings.endpoint,
          publicUrl: settings.publicUrl,
          maxFileSizeMb: settings.maxFileSizeMb,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess({
      id: settings.id,
      provider: settings.provider,
      bucketName: settings.bucketName,
      region: settings.region,
      endpoint: settings.endpoint,
      accessKeyId: settings.accessKeyId,
      secretAccessKey: maskSecret(settings.secretAccessKey),
      publicUrl: settings.publicUrl,
      maxFileSizeMb: settings.maxFileSizeMb,
      allowedMimeTypes: settings.allowedMimeTypes,
      isActive: settings.isActive,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
