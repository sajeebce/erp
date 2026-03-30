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

    const loan = await prisma.pFLoan.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!loan) {
      return apiNotFound('PF loan not found')
    }
    if (loan.status !== 'PENDING') {
      return apiBadRequest(`Cannot approve loan with status "${loan.status}"`)
    }

    const updated = await prisma.pFLoan.update({
      where: { id },
      data: {
        status: 'APPROVED',
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
      resource: 'pf_loan',
      resourceId: id,
      description: `Approved PF loan ${loan.loanNo}`,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
