import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiConflict,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.designation.findUnique({ where: { id } })
    if (!existing) {
      return apiNotFound('Designation not found')
    }

    const body = await request.json()
    const data: { title?: string; level?: number | null; isActive?: boolean } = {}

    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (!title) return apiBadRequest('title is required')

      const duplicate = await prisma.designation.findUnique({ where: { title } })
      if (duplicate && duplicate.id !== id) {
        return apiConflict(`Designation "${title}" already exists`)
      }
      data.title = title
    }

    if (body.level !== undefined) {
      data.level = body.level === null || body.level === '' ? null : Number(body.level)
      if (data.level !== null && (!Number.isInteger(data.level) || data.level < 1)) {
        return apiBadRequest('level must be a positive whole number')
      }
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive)
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.designation.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'designation',
      resourceId: id,
      description: `Updated designation "${updated.title}"`,
      oldValues: { title: existing.title, level: existing.level, isActive: existing.isActive },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
