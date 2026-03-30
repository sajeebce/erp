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

    const payment = await prisma.gratuityPayment.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!payment) {
      return apiNotFound('Gratuity payment not found')
    }
    if (payment.status !== 'APPROVED') {
      return apiBadRequest(`Cannot mark as paid with status "${payment.status}"`)
    }

    const [updated] = await prisma.$transaction([
      prisma.gratuityPayment.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: body.paymentMethod || payment.paymentMethod,
          referenceNo: body.referenceNo || null,
        },
      }),
      prisma.gratuityLedger.update({
        where: { id: payment.ledgerId },
        data: {
          totalPaid: { increment: payment.amount },
          currentBalance: { decrement: payment.amount },
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'gratuity_payment',
      resourceId: id,
      description: `Marked gratuity payment ${payment.paymentNo} as paid`,
      oldValues: { status: 'APPROVED' },
      newValues: { status: 'PAID' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
