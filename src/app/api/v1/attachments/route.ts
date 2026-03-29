import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { deleteFile } from '@/lib/storage/storage-service'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return apiBadRequest('entityType and entityId are required')
    }

    const attachments = await prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        storageKey: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
      },
    })

    return apiSuccess(attachments)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiBadRequest('Attachment id is required')
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      return apiNotFound('Attachment not found')
    }

    await deleteFile(attachment.id, auth.organizationId)

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
