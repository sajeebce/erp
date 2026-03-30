import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { periodStart, periodEnd, interestRate } = body

    if (!periodStart || !periodEnd) {
      return apiBadRequest('periodStart and periodEnd are required')
    }

    const enrollments = await prisma.pFEnrollment.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
      },
    })

    // Get default interest rate from policy if not provided
    let rate = interestRate
    if (!rate) {
      const defaultPolicy = await prisma.pFPolicy.findFirst({
        where: { organizationId: auth.organizationId, isDefault: true, isActive: true },
        select: { interestRate: true },
      })
      rate = defaultPolicy?.interestRate ? Number(defaultPolicy.interestRate) : 9.0
    }

    let processedCount = 0
    let totalInterest = new Prisma.Decimal(0)

    for (const enrollment of enrollments) {
      const openingBalance = enrollment.currentBalance
      if (openingBalance.lte(0)) continue

      // Simple interest: balance * rate / 100
      const interestAmount = new Prisma.Decimal(openingBalance.toString())
        .mul(rate)
        .div(100)

      const closingBalance = openingBalance.add(interestAmount)

      await prisma.$transaction([
        prisma.pFInterestPosting.create({
          data: {
            organizationId: auth.organizationId,
            enrollmentId: enrollment.id,
            employeeId: enrollment.employeeId,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            openingBalance,
            interestRate: rate,
            interestAmount,
            closingBalance,
          },
        }),
        prisma.pFEnrollment.update({
          where: { id: enrollment.id },
          data: {
            totalInterest: { increment: interestAmount },
            currentBalance: { increment: interestAmount },
          },
        }),
      ])

      processedCount++
      totalInterest = totalInterest.add(interestAmount)
    }

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_interest_posting',
      resourceId: `${periodStart}-${periodEnd}`,
      description: `Calculated PF interest for ${processedCount} members, total ${totalInterest}`,
      newValues: { periodStart, periodEnd, rate, processedCount, totalInterest: totalInterest.toString() },
      ...auditCtx,
    })

    return apiSuccess({
      periodStart,
      periodEnd,
      interestRate: rate,
      processedCount,
      totalInterest: totalInterest.toString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
