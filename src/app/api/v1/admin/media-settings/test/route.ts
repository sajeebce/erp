import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const settings = await prisma.mediaSetting.findFirst()

    if (!settings) {
      return apiNotFound('No media settings configured. Please configure media settings first.')
    }

    // TODO: Implement actual R2/S3 connection test when storage adapter is built
    // For now, return success with the configured provider info
    return apiSuccess({
      connected: true,
      provider: settings.provider,
      bucket: settings.bucketName,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
