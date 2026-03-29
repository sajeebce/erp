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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.employeeGrievance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Grievance not found')
    }

    const { escalatedToId, escalationReason } = body
    if (!escalatedToId || !escalationReason) {
      return apiBadRequest('escalatedToId and escalationReason are required')
    }

    const updated = await prisma.employeeGrievance.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalatedToId,
        escalationReason,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'grievance',
      resourceId: id,
      description: `Escalated grievance "${existing.grievanceNo}"`,
      oldValues: { status: existing.status },
      newValues: { status: 'ESCALATED', escalatedToId, escalationReason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
