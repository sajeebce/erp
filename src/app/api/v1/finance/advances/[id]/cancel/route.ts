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

    const advance = await prisma.employeeAdvance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!advance) {
      return apiNotFound('Advance not found')
    }

    if (advance.status !== 'REQUESTED' && advance.status !== 'APPROVED') {
      return apiBadRequest(
        'Only REQUESTED or APPROVED advances can be cancelled. Current status: ' + advance.status,
      )
    }

    const oldStatus = advance.status

    const updated = await prisma.employeeAdvance.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'employee_advance',
      resourceId: id,
      description: `Cancelled advance ${advance.advanceNo}`,
      oldValues: { status: oldStatus },
      newValues: { status: 'CANCELLED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
