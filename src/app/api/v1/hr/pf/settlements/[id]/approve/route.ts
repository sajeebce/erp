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
    if (settlement.status !== 'CALCULATED') {
      return apiBadRequest(`Cannot approve settlement with status "${settlement.status}"`)
    }

    const updated = await prisma.pFSettlement.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_settlement',
      resourceId: id,
      description: `Approved PF settlement ${settlement.settlementNo}`,
      oldValues: { status: 'CALCULATED' },
      newValues: { status: 'APPROVED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
