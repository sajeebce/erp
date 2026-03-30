import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    // PF totals
    const pfAgg = await prisma.pFEnrollment.aggregate({
      where: { organizationId: orgId },
      _sum: { currentBalance: true },
      _count: true,
    })

    const totalPfBalance = pfAgg._sum.currentBalance?.toString() || '0'
    const pfEnrolledCount = pfAgg._count

    // Gratuity totals
    const gratuityAgg = await prisma.gratuityLedger.aggregate({
      where: { organizationId: orgId, isActive: true },
      _sum: { currentBalance: true },
      _count: true,
    })

    const totalGratuityLiability = gratuityAgg._sum.currentBalance?.toString() || '0'

    // Total retirement benefits
    const totalPf = Number(totalPfBalance)
    const totalGratuity = Number(totalGratuityLiability)
    const totalRetirementBenefits = (totalPf + totalGratuity).toString()

    // Last month's PF contributions
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    const lastMonthContribs = await prisma.pFContribution.aggregate({
      where: {
        organizationId: orgId,
        month: lastMonth,
        year: lastMonthYear,
      },
      _sum: { totalAmount: true },
    })

    const monthlyContributionTotal = lastMonthContribs._sum.totalAmount?.toString() || '0'

    // Fund adequacy (PF trust balance / total member balance)
    const trust = await prisma.pFTrust.findFirst({
      where: { organizationId: orgId, isActive: true },
      select: { currentBalance: true },
    })

    const fundBalance = Number(trust?.currentBalance || 0)
    const totalLiability = totalPf + totalGratuity
    const fundAdequacyRatio = totalLiability > 0
      ? (fundBalance / totalLiability * 100).toFixed(2)
      : '0'

    return apiSuccess({
      totalPfBalance,
      totalGratuityLiability,
      totalRetirementBenefits,
      pfEnrolledCount,
      gratuityEnrolledCount: gratuityAgg._count,
      monthlyContributionTotal,
      fundAdequacyRatio: `${fundAdequacyRatio}%`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
