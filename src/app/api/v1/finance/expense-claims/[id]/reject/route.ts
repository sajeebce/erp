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
    const { rejectionReason } = body

    if (!rejectionReason || !rejectionReason.trim()) {
      return apiBadRequest('rejectionReason is required')
    }

    const claim = await prisma.expenseClaim.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!claim) {
      return apiNotFound('Expense claim not found')
    }

    if (claim.status === 'PAID' || claim.status === 'CANCELLED') {
      return apiBadRequest('Cannot reject a claim that is already ' + claim.status)
    }

    const oldStatus = claim.status

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: id,
      description: `Rejected expense claim ${claim.claimNo}: ${rejectionReason.trim()}`,
      oldValues: { status: oldStatus },
      newValues: { status: 'REJECTED', rejectionReason: rejectionReason.trim() },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
