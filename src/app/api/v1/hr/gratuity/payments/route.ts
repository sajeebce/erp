import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated, apiPaginated, apiBadRequest,
  handleRouteError, parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Prisma.GratuityPaymentWhereInput = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    const employeeId = url.searchParams.get('employeeId')
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const [payments, total] = await Promise.all([
      prisma.gratuityPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gratuityPayment.count({ where }),
    ])

    return apiPaginated(payments, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, paymentType, amount, calculationBase, serviceYears, serviceDays, notes, offboardingId, paymentMethod } = body

    if (!employeeId || !paymentType || !amount) {
      return apiBadRequest('employeeId, paymentType, and amount are required')
    }

    const ledger = await prisma.gratuityLedger.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
    })
    if (!ledger) {
      return apiBadRequest('No gratuity ledger found for this employee')
    }

    const paymentNo = await generateNextNumber(auth.organizationId, 'gratuity_payment')

    const payment = await prisma.gratuityPayment.create({
      data: {
        organizationId: auth.organizationId,
        paymentNo,
        ledgerId: ledger.id,
        employeeId,
        paymentType,
        amount,
        calculationBase: calculationBase || 0,
        serviceYears: serviceYears || 0,
        serviceDays: serviceDays || 0,
        notes: notes || null,
        offboardingId: offboardingId || null,
        paymentMethod: paymentMethod || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'gratuity_payment',
      resourceId: payment.id,
      description: `Created gratuity payment ${paymentNo} for employee ${employeeId}`,
      newValues: { paymentNo, amount, paymentType },
      ...auditCtx,
    })

    return apiCreated(payment)
  } catch (error) {
    return handleRouteError(error)
  }
}
