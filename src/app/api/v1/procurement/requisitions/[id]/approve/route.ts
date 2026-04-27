import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { checkProcurementBudget } from '@/lib/procurement-budget'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

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

    if (requisition.status !== 'DRAFT' && requisition.status !== 'SUBMITTED' && requisition.status !== 'REVIEWED') {
      return apiForbidden('Only DRAFT, SUBMITTED, or REVIEWED requisitions can be approved')
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

    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: new Date(),
        budgetId: budgetCheck.budgetId || requisition.budgetId,
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
        budgetCheckedAt: new Date(),
        approvedWithBudgetWarning: budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET',
        warningApprovedById: budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET' ? auth.userId : null,
        warningApprovedAt: budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET' ? new Date() : null,
      },
      select: {
        id: true,
        prNo: true,
        status: true,
        approvedById: true,
        approvedAt: true,
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
      description: `Approved purchase requisition ${requisition.prNo}`,
      newValues: {
        status: 'APPROVED',
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
      },
      ...audit,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
