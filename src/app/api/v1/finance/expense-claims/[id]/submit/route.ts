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
      include: { items: true },
    })

    if (!claim) {
      return apiNotFound('Expense claim not found')
    }

    if (claim.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT claims can be submitted. Current status: ' + claim.status)
    }

    // Validate: at least 1 item
    if (claim.items.length === 0) {
      return apiBadRequest('Claim must have at least one item before submitting')
    }

    // Validate each item has category, description, and amount > 0
    for (let i = 0; i < claim.items.length; i++) {
      const item = claim.items[i]
      if (!item.category || !item.description) {
        return apiBadRequest(`Item ${i + 1}: category and description are required`)
      }
      if (Number(item.amount) <= 0) {
        return apiBadRequest(`Item ${i + 1}: amount must be greater than 0`)
      }
    }

    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: id,
      description: `Submitted expense claim ${claim.claimNo}`,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'SUBMITTED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
