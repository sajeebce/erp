import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiSuccess, apiBadRequest, apiNotFound, apiForbidden, handleRouteError } from '@/lib/api-response'
import { DEFAULT_PR_WORKFLOW_NAME, processApproval, startApproval } from '@/lib/approval-engine'

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
    const body = await request.json()
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!reason) return apiBadRequest('reason is required')

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, deletedAt: null },
      include: { project: { select: { organizationId: true } } },
    })

    if (!requisition) return apiNotFound('Purchase requisition not found')

    const belongsToOrg = await requisitionBelongsToOrg(requisition, auth.organizationId)
    if (!belongsToOrg) return apiNotFound('Purchase requisition not found')

    if (requisition.status !== 'SUBMITTED' && requisition.status !== 'REVIEWED') {
      return apiForbidden(`Only SUBMITTED or REVIEWED requisitions can be rejected. Current status: ${requisition.status}`)
    }

    const approval = await startApproval({
      organizationId: auth.organizationId,
      workflowName: DEFAULT_PR_WORKFLOW_NAME,
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisition.id,
      requestedById: requisition.requestedById,
      amount: Number(requisition.totalEstimate),
    })
    const approvalResult = await processApproval(approval.instanceId, auth.userId, 'REJECT', reason)

    const rejectedAt = new Date()
    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: auth.userId,
        rejectedAt,
        rejectionReason: reason,
      },
      select: {
        id: true,
        prNo: true,
        status: true,
        rejectedById: true,
        rejectedAt: true,
        rejectionReason: true,
        updatedAt: true,
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'REJECT',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: `Rejected purchase requisition ${requisition.prNo}: ${reason}`,
      oldValues: { status: requisition.status },
      newValues: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvalInstanceId: approvalResult.instanceId,
        approvalStep: approval.currentStep,
      },
      ...audit,
    })

    return apiSuccess({ ...updated, approval: approvalResult })
  } catch (error) {
    return handleRouteError(error)
  }
}
