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

    const payment = await prisma.gratuityPayment.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!payment) {
      return apiNotFound('Gratuity payment not found')
    }
    if (payment.status !== 'PENDING') {
      return apiBadRequest(`Cannot approve payment with status "${payment.status}"`)
    }

    const updated = await prisma.gratuityPayment.update({
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
      resource: 'gratuity_payment',
      resourceId: id,
      description: `Approved gratuity payment ${payment.paymentNo}`,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
