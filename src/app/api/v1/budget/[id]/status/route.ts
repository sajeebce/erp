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

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'DRAFT'],       // Approve or send back to draft
  APPROVED: ['ACTIVE', 'REVISED'],
  ACTIVE: ['REVISED', 'CLOSED'],
  REVISED: ['ACTIVE'],
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json()
    const { action, reason } = body

    if (!action) {
      return apiBadRequest('Action is required (submit, approve, reject, activate, close)')
    }

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        project: { select: { name: true } },
      },
    })

    if (!budget) {
      return apiNotFound('Budget not found')
    }

    let newStatus: string
    let description: string

    switch (action) {
      case 'submit':
        if (budget.status !== 'DRAFT') {
          return apiBadRequest('Only DRAFT budgets can be submitted for approval')
        }
        newStatus = 'SUBMITTED'
        description = `Submitted budget "${budget.name}" for approval`
        break

      case 'approve':
        if (budget.status !== 'SUBMITTED') {
          return apiBadRequest('Only SUBMITTED budgets can be approved')
        }
        newStatus = 'APPROVED'
        description = `Approved budget "${budget.name}"`
        break

      case 'reject':
        if (budget.status !== 'SUBMITTED') {
          return apiBadRequest('Only SUBMITTED budgets can be rejected')
        }
        if (!reason) {
          return apiBadRequest('Reason is required when rejecting a budget')
        }
        newStatus = 'DRAFT'
        description = `Rejected budget "${budget.name}" — ${reason}`
        break

      case 'activate':
        if (budget.status !== 'APPROVED') {
          return apiBadRequest('Only APPROVED budgets can be activated')
        }
        newStatus = 'ACTIVE'
        description = `Activated budget "${budget.name}"`
        break

      case 'close':
        if (budget.status !== 'ACTIVE') {
          return apiBadRequest('Only ACTIVE budgets can be closed')
        }
        newStatus = 'CLOSED'
        description = `Closed budget "${budget.name}"`
        break

      default:
        return apiBadRequest(`Invalid action: ${action}. Valid: submit, approve, reject, activate, close`)
    }

    // Check transition is valid
    const allowed = VALID_TRANSITIONS[budget.status] || []
    if (!allowed.includes(newStatus)) {
      return apiBadRequest(`Cannot transition from ${budget.status} to ${newStatus}`)
    }

    // Update budget status
    const updated = await prisma.budget.update({
      where: { id },
      data: {
        status: newStatus as any,
        ...(newStatus === 'APPROVED' && {
          approvedById: auth.userId,
          approvedAt: new Date(),
        }),
      },
      include: {
        project: { select: { id: true, name: true } },
        grant: { select: { id: true, title: true } },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'budget',
      resource: 'budget',
      resourceId: id,
      description,
      oldValues: { status: budget.status },
      newValues: { status: newStatus, reason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
