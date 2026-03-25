import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
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
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params

    // Fetch requisition with tenant isolation through grant -> donor
    const requisition = await prisma.fundRequisition.findFirst({
      where: {
        id,
        grant: { donor: { organizationId: auth.organizationId } },
      },
      include: {
        grant: {
          select: {
            id: true,
            grantNo: true,
            title: true,
            awardAmount: true,
            disbursedAmount: true,
          },
        },
      },
    })

    if (!requisition) {
      return apiNotFound('Fund requisition not found')
    }

    if (requisition.status !== 'DRAFT' && requisition.status !== 'SUBMITTED') {
      return apiBadRequest(
        `Only DRAFT or SUBMITTED requisitions can be approved. Current status: ${requisition.status}`
      )
    }

    // Check grant has sufficient remaining balance
    const awardAmount = Number(requisition.grant.awardAmount)
    const disbursedAmount = Number(requisition.grant.disbursedAmount)
    const requestedAmount = Number(requisition.amount)
    const remainingBalance = awardAmount - disbursedAmount

    if (remainingBalance < requestedAmount) {
      return apiBadRequest(
        `Insufficient grant balance. Remaining: ${remainingBalance.toFixed(2)}, ` +
          `Requested: ${requestedAmount.toFixed(2)}`
      )
    }

    const now = new Date()

    const updated = await prisma.fundRequisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: now,
      },
      select: {
        id: true,
        requisitionNo: true,
        date: true,
        grantId: true,
        projectId: true,
        amount: true,
        purpose: true,
        requestedById: true,
        status: true,
        approvedById: true,
        approvedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        grant: {
          select: {
            id: true,
            grantNo: true,
            title: true,
            awardAmount: true,
            disbursedAmount: true,
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'donor',
      resource: 'fund_requisition',
      resourceId: id,
      description: `Approved fund requisition ${requisition.requisitionNo} (${requestedAmount} BDT) for grant ${requisition.grant.grantNo}`,
      oldValues: { status: requisition.status },
      newValues: { status: 'APPROVED', approvedById: auth.userId, approvedAt: now },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
