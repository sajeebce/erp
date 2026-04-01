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

    const pfBalance = Number(pfAgg._sum.currentBalance ?? 0)
    const pfMembers = pfAgg._count

    // PF average balance
    const pfAvgBalance = pfMembers > 0 ? pfBalance / pfMembers : 0

    // Gratuity totals
    const gratuityAgg = await prisma.gratuityLedger.aggregate({
      where: { organizationId: orgId, isActive: true },
      _sum: { currentBalance: true },
      _count: true,
    })

    const gratuityLiability = Number(gratuityAgg._sum.currentBalance ?? 0)
    const gratuityEmployees = gratuityAgg._count

    // Gratuity vested count
    const vestedCount = await prisma.gratuityLedger.count({
      where: { organizationId: orgId, isActive: true, isVested: true },
    })

    // Total retirement liability
    const totalRetirementLiability = pfBalance + gratuityLiability

    // Total enrolled employees (unique across PF and gratuity)
    const enrolledEmployees = pfMembers + gratuityEmployees

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

    const monthlyContribution = Number(lastMonthContribs._sum.totalAmount ?? 0)

    // Fund adequacy (PF trust balance / total liability)
    const trust = await prisma.pFTrust.findFirst({
      where: { organizationId: orgId, isActive: true },
      select: { currentBalance: true },
    })

    const fundBalance = Number(trust?.currentBalance ?? 0)
    const fundAdequacyRatio = totalRetirementLiability > 0
      ? Number((fundBalance / totalRetirementLiability * 100).toFixed(2))
      : 0

    return apiSuccess({
      totalRetirementLiability,
      pfBalance,
      gratuityLiability,
      enrolledEmployees,
      monthlyContribution,
      fundAdequacyRatio,
      pfSummary: {
        members: pfMembers,
        totalBalance: pfBalance,
        avgBalance: Number(pfAvgBalance.toFixed(2)),
      },
      gratuitySummary: {
        employees: gratuityEmployees,
        totalLiability: gratuityLiability,
        vestedCount,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
