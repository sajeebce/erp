import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { apiSuccess, apiUnauthorized, handleRouteError } from '@/lib/api-response'

type Classification = 'REGULAR' | 'WATCH' | 'SUBSTANDARD' | 'DOUBTFUL' | 'BAD'

function getExpectedPaymentIntervalDays(frequency: string): number {
  switch (frequency) {
    case 'WEEKLY': return 7
    case 'BIWEEKLY': return 14
    case 'MONTHLY': return 30
    default: return 30
  }
}

function classifyLoan(daysOverdue: number): Classification {
  if (daysOverdue <= 0) return 'REGULAR'
  if (daysOverdue <= 30) return 'WATCH'
  if (daysOverdue <= 180) return 'SUBSTANDARD'
  if (daysOverdue <= 365) return 'DOUBTFUL'
  return 'BAD'
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return apiUnauthorized('Invalid cron secret')
    }

    const now = new Date()
    let totalChecked = 0
    let totalUpdated = 0
    const classificationCounts: Record<Classification, number> = {
      REGULAR: 0,
      WATCH: 0,
      SUBSTANDARD: 0,
      DOUBTFUL: 0,
      BAD: 0,
    }

    const activeLoans = await prisma.loanAccount.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        lastPaymentDate: true,
        disbursedAt: true,
        outstandingBalance: true,
        installmentAmount: true,
        classification: true,
        daysOverdue: true,
        product: {
          select: { repaymentFrequency: true },
        },
      },
    })

    totalChecked = activeLoans.length

    for (const loan of activeLoans) {
      const referenceDate = loan.lastPaymentDate ?? loan.disbursedAt
      if (!referenceDate) continue

      const intervalDays = getExpectedPaymentIntervalDays(loan.product.repaymentFrequency)
      const expectedPaymentDate = new Date(referenceDate)
      expectedPaymentDate.setDate(expectedPaymentDate.getDate() + intervalDays)

      let daysOverdue = 0
      if (now > expectedPaymentDate) {
        daysOverdue = Math.floor(
          (now.getTime() - expectedPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      const newClassification = classifyLoan(daysOverdue)
      classificationCounts[newClassification]++

      // Only update if classification or daysOverdue changed
      if (loan.classification !== newClassification || loan.daysOverdue !== daysOverdue) {
        const missedInstallments = Math.ceil(daysOverdue / intervalDays)
        const overdueAmount = daysOverdue > 0
          ? new Prisma.Decimal(loan.installmentAmount.toNumber() * missedInstallments)
          : new Prisma.Decimal(0)

        // Cap overdueAmount at outstandingBalance
        const cappedOverdue = overdueAmount.greaterThan(loan.outstandingBalance)
          ? loan.outstandingBalance
          : overdueAmount

        await prisma.loanAccount.update({
          where: { id: loan.id },
          data: {
            daysOverdue,
            classification: newClassification,
            overdueAmount: cappedOverdue,
          },
        })
        totalUpdated++
      }
    }

    return apiSuccess({
      totalChecked,
      totalUpdated,
      classificationCounts,
      checkedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
