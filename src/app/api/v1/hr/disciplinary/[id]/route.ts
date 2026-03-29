import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const disciplinaryCase = await prisma.disciplinaryCase.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!disciplinaryCase) {
      return apiNotFound('Disciplinary case not found')
    }

    return apiSuccess(disciplinaryCase)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.disciplinaryCase.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Disciplinary case not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.action !== undefined) data.action = body.action
    if (body.reason !== undefined) data.reason = body.reason
    if (body.description !== undefined) data.description = body.description
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    if (body.suspensionStart !== undefined) data.suspensionStart = body.suspensionStart ? new Date(body.suspensionStart) : null
    if (body.suspensionEnd !== undefined) data.suspensionEnd = body.suspensionEnd ? new Date(body.suspensionEnd) : null
    if (body.withPay !== undefined) data.withPay = body.withPay
    if (body.appealOutcome !== undefined) data.appealOutcome = body.appealOutcome
    if (body.acknowledgedAt !== undefined) data.acknowledgedAt = body.acknowledgedAt ? new Date(body.acknowledgedAt) : new Date()
    if (body.evidencePaths !== undefined) data.evidencePaths = body.evidencePaths
    if (body.notes !== undefined) data.notes = body.notes || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.disciplinaryCase.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'disciplinary_case',
      resourceId: id,
      description: `Updated disciplinary case "${existing.caseNo}"`,
      oldValues: { action: existing.action, reason: existing.reason },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
