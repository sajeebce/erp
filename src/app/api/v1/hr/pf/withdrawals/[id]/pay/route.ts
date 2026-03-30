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

    const withdrawal = await prisma.pFWithdrawal.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!withdrawal) {
      return apiNotFound('PF withdrawal not found')
    }
    if (withdrawal.status !== 'APPROVED') {
      return apiBadRequest(`Cannot mark as paid with status "${withdrawal.status}"`)
    }

    const [updated] = await prisma.$transaction([
      prisma.pFWithdrawal.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
      prisma.pFEnrollment.update({
        where: { id: withdrawal.enrollmentId },
        data: {
          totalWithdrawals: { increment: withdrawal.amount },
          currentBalance: { decrement: withdrawal.amount },
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_withdrawal',
      resourceId: id,
      description: `Marked PF withdrawal ${withdrawal.withdrawalNo} as paid`,
      oldValues: { status: 'APPROVED' },
      newValues: { status: 'PAID' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
