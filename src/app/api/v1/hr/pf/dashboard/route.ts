import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const [
      trustBalanceResult,
      enrolledMembers,
      monthlyContribAgg,
      activeLoans,
      investmentReturnsAgg,
      recentContributions,
    ] = await Promise.all([
      // Total fund balance from PFTrust
      prisma.pFTrust.aggregate({
        where: { organizationId: orgId, isActive: true },
        _sum: { currentBalance: true },
      }),

      // Enrolled members count
      prisma.pFEnrollment.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),

      // Monthly contribution sum for latest month
      prisma.pFContribution.aggregate({
        where: { organizationId: orgId, month: currentMonth, year: currentYear },
        _sum: { totalAmount: true },
      }),

      // Active loans count
      prisma.pFLoan.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),

      // Investment returns — filter through trust → investments for this org
      (async () => {
        const trusts = await prisma.pFTrust.findMany({
          where: { organizationId: orgId, isActive: true },
          select: { id: true },
        })
        const trustIds = trusts.map((t) => t.id)
        if (trustIds.length === 0) return { _sum: { amount: null } }
        const investments = await prisma.pFInvestment.findMany({
          where: { trustId: { in: trustIds } },
          select: { id: true },
        })
        const investmentIds = investments.map((i) => i.id)
        if (investmentIds.length === 0) return { _sum: { amount: null } }
        return prisma.pFInvestmentIncome.aggregate({
          where: { investmentId: { in: investmentIds } },
          _sum: { amount: true },
        })
      })(),

      // Recent contributions with employee names
      prisma.pFContribution.findMany({
        where: { organizationId: orgId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          employeeId: true,
          month: true,
          year: true,
          employeeAmount: true,
          employerAmount: true,
          totalAmount: true,
        },
      }),
    ])

    // Fetch employee names for recent contributions
    const employeeIds = [...new Set(recentContributions.map((c) => c.employeeId))]
    const employees = employeeIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, fullName: true },
        })
      : []
    const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]))

    const monthNames = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const dashboard = {
      totalFundBalance: Number(trustBalanceResult._sum.currentBalance ?? 0),
      enrolledMembers,
      monthlyContribution: Number(monthlyContribAgg._sum.totalAmount ?? 0),
      activeLoans,
      investmentReturns: Number(investmentReturnsAgg._sum.amount ?? 0),
      recentContributions: recentContributions.map((c) => ({
        id: c.id,
        employeeName: employeeMap.get(c.employeeId) || 'Unknown',
        month: `${monthNames[c.month]} ${c.year}`,
        employeeAmount: Number(c.employeeAmount),
        employerAmount: Number(c.employerAmount),
        total: Number(c.totalAmount),
      })),
    }

    return apiSuccess(dashboard)
  } catch (error) {
    return handleRouteError(error)
  }
}
