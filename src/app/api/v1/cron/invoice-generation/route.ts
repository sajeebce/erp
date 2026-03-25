import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { apiSuccess, apiUnauthorized, handleRouteError } from '@/lib/api-response'

function getNextPaymentDate(current: Date, billingCycle: string): Date {
  const next = new Date(current)
  switch (billingCycle) {
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
    case 'MONTHLY':
    default:
      next.setMonth(next.getMonth() + 1)
      break
  }
  return next
}

function getPeriodEnd(periodStart: Date, billingCycle: string): Date {
  const end = new Date(periodStart)
  switch (billingCycle) {
    case 'QUARTERLY':
      end.setMonth(end.getMonth() + 3)
      break
    case 'YEARLY':
      end.setFullYear(end.getFullYear() + 1)
      break
    case 'MONTHLY':
    default:
      end.setMonth(end.getMonth() + 1)
      break
  }
  end.setDate(end.getDate() - 1)
  return end
}

function getAmount(
  plan: { priceMonthly: Prisma.Decimal; priceQuarterly: Prisma.Decimal | null; priceYearly: Prisma.Decimal | null },
  billingCycle: string
): Prisma.Decimal {
  switch (billingCycle) {
    case 'QUARTERLY':
      return plan.priceQuarterly ?? new Prisma.Decimal(plan.priceMonthly.toNumber() * 3)
    case 'YEARLY':
      return plan.priceYearly ?? new Prisma.Decimal(plan.priceMonthly.toNumber() * 12)
    case 'MONTHLY':
    default:
      return plan.priceMonthly
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return apiUnauthorized('Invalid cron secret')
    }

    const now = new Date()
    let invoicesGenerated = 0

    const dueSubs = await prisma.tenantSubscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: { lte: now },
      },
      include: {
        plan: {
          select: {
            priceMonthly: true,
            priceQuarterly: true,
            priceYearly: true,
            name: true,
          },
        },
      },
    })

    for (const sub of dueSubs) {
      const amount = getAmount(sub.plan, sub.billingCycle)
      const periodStart = sub.nextPaymentDate ?? now
      const periodEnd = getPeriodEnd(periodStart, sub.billingCycle)
      const dueDate = new Date(periodStart)
      dueDate.setDate(dueDate.getDate() + 14) // 14 days to pay

      const invoiceNo = `INV-${sub.organizationId.slice(0, 8).toUpperCase()}-${Date.now()}`

      await prisma.tenantInvoice.create({
        data: {
          invoiceNo,
          subscriptionId: sub.id,
          organizationId: sub.organizationId,
          amount,
          tax: new Prisma.Decimal(0),
          total: amount,
          description: `${sub.plan.name} - ${sub.billingCycle.toLowerCase()} subscription`,
          periodStart,
          periodEnd,
          dueDate,
          status: 'PENDING',
        },
      })

      const nextPaymentDate = getNextPaymentDate(periodStart, sub.billingCycle)

      await prisma.tenantSubscription.update({
        where: { id: sub.id },
        data: {
          nextPaymentDate,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      })

      invoicesGenerated++
    }

    return apiSuccess({
      invoicesGenerated,
      totalDueSubscriptions: dueSubs.length,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
