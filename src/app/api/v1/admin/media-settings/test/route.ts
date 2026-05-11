import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import { getStorageAdapter } from '@/lib/storage/storage-factory'
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

    const result = await getStorageAdapter().then((adapter) => adapter.testConnection())

    return apiSuccess({
      connected: result.success,
      error: result.error,
      provider: settings.provider,
      bucket: settings.bucketName,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
