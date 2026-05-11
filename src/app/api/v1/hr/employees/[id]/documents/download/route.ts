import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { getStorageAdapter } from '@/lib/storage/storage-factory'
import { apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params
    const { searchParams } = new URL(request.url)
    const storageKey = searchParams.get('key')

    if (!storageKey) {
      return apiBadRequest('Document key is required')
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    if (!storageKey.startsWith(`${auth.organizationId}/`)) {
      return apiNotFound('Document not found')
    }

    const adapter = await getStorageAdapter()
    const buffer = await adapter.download(storageKey)
    const attachment = await prisma.attachment.findFirst({
      where: { storageKey },
      select: { originalName: true, mimeType: true },
    })
    const fileName = (attachment?.originalName || storageKey.split('/').pop() || 'document').replace(/"/g, '')

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': attachment?.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
