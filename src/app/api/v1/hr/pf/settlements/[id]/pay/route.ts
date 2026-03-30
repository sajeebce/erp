import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, apiNotFound, handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const settlement = await prisma.pFSettlement.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!settlement) {
      return apiNotFound('PF settlement not found')
    }
    if (settlement.status !== 'APPROVED') {
      return apiBadRequest(`Cannot mark as paid with status "${settlement.status}"`)
    }

    const [updated] = await prisma.$transaction([
      prisma.pFSettlement.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
      prisma.pFEnrollment.update({
        where: { id: settlement.enrollmentId },
        data: {
          status: 'SETTLED',
          settledAt: new Date(),
          currentBalance: 0,
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_settlement',
      resourceId: id,
      description: `Paid PF settlement ${settlement.settlementNo}`,
      oldValues: { status: 'APPROVED' },
      newValues: { status: 'PAID' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
