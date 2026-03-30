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

    const claim = await prisma.expenseClaim.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!claim) {
      return apiNotFound('Expense claim not found')
    }

    if (claim.status !== 'SUBMITTED') {
      return apiBadRequest(
        'Only SUBMITTED claims can be supervisor-approved. Current status: ' + claim.status,
      )
    }

    const now = new Date()

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'SUPERVISOR_APPROVED',
        supervisorId: auth.userId,
        supervisorApprovedAt: now,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: id,
      description: `Supervisor approved expense claim ${claim.claimNo}`,
      oldValues: { status: 'SUBMITTED' },
      newValues: { status: 'SUPERVISOR_APPROVED', supervisorId: auth.userId, supervisorApprovedAt: now },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
