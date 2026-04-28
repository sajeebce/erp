import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { checkProcurementBudget } from '@/lib/procurement-budget'
import { DEFAULT_PR_WORKFLOW_NAME, processApproval, startApproval } from '@/lib/approval-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const approvalNote = typeof body.approvalNote === 'string' ? body.approvalNote.trim() : ''

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        project: { select: { organizationId: true } },
        lines: true,
      },
    })

    if (!requisition) {
      return apiNotFound('Purchase requisition not found')
    }

    const requester = await prisma.user.findFirst({
      where: {
        id: requisition.requestedById,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    const belongsToOrg =
      requisition.project?.organizationId === auth.organizationId || Boolean(requester)

    if (!belongsToOrg) {
      return apiNotFound('Purchase requisition not found')
    }

    if (requisition.status !== 'SUBMITTED' && requisition.status !== 'REVIEWED') {
      return apiForbidden('Only SUBMITTED or REVIEWED requisitions can be approved')
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

    const approval = await startApproval({
      organizationId: auth.organizationId,
      workflowName: DEFAULT_PR_WORKFLOW_NAME,
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisition.id,
      requestedById: requisition.requestedById,
      amount: Number(requisition.totalEstimate),
    })
    const approvalResult = await processApproval(approval.instanceId, auth.userId, 'APPROVE', approvalNote || undefined)

    const isFinalApproval = approvalResult.isComplete && approvalResult.status === 'APPROVED'
    const now = new Date()
    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: isFinalApproval ? 'APPROVED' : 'REVIEWED',
        approvedById: isFinalApproval ? auth.userId : null,
        approvedAt: isFinalApproval ? now : null,
        approvalNote: isFinalApproval ? approvalNote || null : null,
        budgetId: budgetCheck.budgetId || requisition.budgetId,
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
        budgetCheckedAt: now,
        approvedWithBudgetWarning: isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET'),
        warningApprovedById: isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET') ? auth.userId : null,
        warningApprovedAt: isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET') ? now : null,
      },
      select: {
        id: true,
        prNo: true,
        status: true,
        approvedById: true,
        approvedAt: true,
        approvalNote: true,
        budgetCheckStatus: true,
        budgetWarningMessage: true,
        approvedWithBudgetWarning: true,
        updatedAt: true,
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: isFinalApproval
        ? `Approved purchase requisition ${requisition.prNo}`
        : `Approved workflow step ${approval.currentStep} for purchase requisition ${requisition.prNo}`,
      newValues: {
        status: isFinalApproval ? 'APPROVED' : 'REVIEWED',
        approvalNote: approvalNote || null,
        approvalInstanceId: approvalResult.instanceId,
        approvalStep: approval.currentStep,
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
      },
      ...audit,
    })

    return apiSuccess({ ...updated, approval: approvalResult })
  } catch (error) {
    return handleRouteError(error)
  }
}
