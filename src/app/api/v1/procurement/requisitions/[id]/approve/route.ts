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
        OR: [
          { project: { organizationId: auth.organizationId } },
          { requestedById: { not: undefined } },
        ],
      },
      include: {
        project: { select: { organizationId: true } },
      },
    })

    if (!requisition) {
      return apiNotFound('Purchase requisition not found')
    }

    // Verify org ownership through project
    if (requisition.project && requisition.project.organizationId !== auth.organizationId) {
      return apiNotFound('Purchase requisition not found')
    }

    if (requisition.status !== 'DRAFT' && requisition.status !== 'SUBMITTED' && requisition.status !== 'REVIEWED') {
      return apiForbidden('Only DRAFT, SUBMITTED, or REVIEWED requisitions can be approved')
    }

    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        prNo: true,
        status: true,
        approvedById: true,
        approvedAt: true,
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
      ...audit,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
