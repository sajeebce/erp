import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiSuccess, apiNotFound, apiForbidden, handleRouteError } from '@/lib/api-response'
import { checkProcurementBudget } from '@/lib/procurement-budget'
import { DEFAULT_PR_WORKFLOW_NAME, startApproval } from '@/lib/approval-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function requisitionBelongsToOrg(
  requisition: { project: { organizationId: string } | null; requestedById: string },
  organizationId: string
) {
  if (requisition.project?.organizationId === organizationId) return true

  const requester = await prisma.user.findFirst({
    where: { id: requisition.requestedById, organizationId, deletedAt: null },
    select: { id: true },
  })

  return Boolean(requester)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { organizationId: true } },
        lines: true,
      },
    })

    if (!requisition) return apiNotFound('Purchase requisition not found')

    const belongsToOrg = await requisitionBelongsToOrg(requisition, auth.organizationId)
    if (!belongsToOrg) return apiNotFound('Purchase requisition not found')

    if (auth.roleName !== 'ADMIN' && requisition.requestedById !== auth.userId) {
      return apiForbidden('Only the requester or an admin can submit this requisition')
    }

    if (requisition.status !== 'DRAFT' && requisition.status !== 'RETURNED') {
      return apiForbidden(`Only DRAFT or RETURNED requisitions can be submitted. Current status: ${requisition.status}`)
    }

    const budgetCheck = await checkProcurementBudget({
      organizationId: auth.organizationId,
      requisitionId: requisition.id,
      budgetId: requisition.budgetId,
      businessUnitId: requisition.businessUnitId,
      costCenterId: requisition.costCenterId,
      fundClassId: requisition.fundClassId,
      projectId: requisition.projectId,
      totalEstimate: Number(requisition.totalEstimate),
    })

    const submittedAt = new Date()
    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        budgetId: budgetCheck.budgetId || requisition.budgetId,
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
        budgetCheckedAt: submittedAt,
      },
      select: {
        id: true,
        prNo: true,
        status: true,
        submittedAt: true,
        budgetCheckStatus: true,
        budgetWarningMessage: true,
        updatedAt: true,
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: `Submitted purchase requisition ${requisition.prNo}`,
      oldValues: { status: requisition.status },
      newValues: {
        status: 'SUBMITTED',
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
      },
      ...audit,
    })

    const approval = await startApproval({
      organizationId: auth.organizationId,
      workflowName: DEFAULT_PR_WORKFLOW_NAME,
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisition.id,
      requestedById: requisition.requestedById,
      amount: Number(requisition.totalEstimate),
    })

    return apiSuccess({ ...updated, approval })
  } catch (error) {
    return handleRouteError(error)
  }
}
