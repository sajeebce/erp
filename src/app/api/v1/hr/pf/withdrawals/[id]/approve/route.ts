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
    const body = await request.json()

    const withdrawal = await prisma.pFWithdrawal.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!withdrawal) {
      return apiNotFound('PF withdrawal not found')
    }
    if (withdrawal.status !== 'PENDING') {
      return apiBadRequest(`Cannot approve withdrawal with status "${withdrawal.status}"`)
    }

    const newStatus = body.approved === false ? 'REJECTED' : 'APPROVED'

    const updated = await prisma.pFWithdrawal.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: auth.userId,
        approvedAt: new Date(),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_withdrawal',
      resourceId: id,
      description: `${newStatus} PF withdrawal ${withdrawal.withdrawalNo}`,
      oldValues: { status: 'PENDING' },
      newValues: { status: newStatus },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
