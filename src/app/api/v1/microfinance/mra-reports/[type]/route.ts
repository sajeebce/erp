import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ type: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { type } = await params

    // Get org member IDs for tenant scoping
    const orgMembers = await prisma.mFIMember.findMany({
      where: { samity: { branch: { organizationId: auth.organizationId } } },
      select: { id: true },
    })
    const orgMemberIds = orgMembers.map((m) => m.id)

    if (type === 'cdf-1') {
      return apiSuccess(await generateCDF1(orgMemberIds))
    }

    if (type === 'portfolio-quality') {
      return apiSuccess(await generatePortfolioQuality(orgMemberIds))
    }

    return apiBadRequest('Invalid report type. Supported: cdf-1, portfolio-quality')
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * CDF-1: Monthly Return Report
 * - Total borrowers, outstanding portfolio, savings portfolio,
 *   recovery rate, PAR>30
 */
async function generateCDF1(memberIds: string[]) {
  const memberFilter = { memberId: { in: memberIds } }

  const [
    activeLoans,
    totalBorrowers,
    loanPortfolio,
    savingsPortfolio,
    repaymentStats,
    par30Loans,
  ] = await Promise.all([
    // Total active loan accounts
    prisma.loanAccount.count({
      where: { ...memberFilter, status: 'ACTIVE' },
    }),
    // Total unique borrowers with active loans
    prisma.loanAccount.groupBy({
      by: ['memberId'],
      where: { ...memberFilter, status: 'ACTIVE' },
    }),
    // Outstanding portfolio
    prisma.loanAccount.aggregate({
      where: { ...memberFilter, status: 'ACTIVE' },
      _sum: {
        outstandingBalance: true,
        principalAmount: true,
        totalRepayable: true,
        totalPaid: true,
      },
    }),
    // Savings portfolio
    prisma.savingsAccount.aggregate({
      where: { ...memberFilter, isActive: true },
      _sum: { balance: true, totalDeposited: true, totalWithdrawn: true },
      _count: true,
    }),
    // Repayment stats (current month)
    (() => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return prisma.loanRepayment.aggregate({
        where: {
          loanAccountId: {
            in: memberIds, // Will be filtered further
          },
          date: { gte: startOfMonth },
          loanAccount: { memberId: { in: memberIds } },
        },
        _sum: { totalAmount: true },
        _count: true,
      })
    })(),
    // PAR > 30 days
    prisma.loanAccount.aggregate({
      where: { ...memberFilter, status: 'ACTIVE', daysOverdue: { gt: 30 } },
      _sum: { outstandingBalance: true },
      _count: true,
    }),
  ])

  const totalOutstanding = Number(loanPortfolio._sum.outstandingBalance || 0)
  const totalRepayable = Number(loanPortfolio._sum.totalRepayable || 0)
  const totalPaid = Number(loanPortfolio._sum.totalPaid || 0)
  const par30Outstanding = Number(par30Loans._sum.outstandingBalance || 0)

  const recoveryRate = totalRepayable > 0
    ? Math.round((totalPaid / totalRepayable) * 10000) / 100
    : 0

  const parRate = totalOutstanding > 0
    ? Math.round((par30Outstanding / totalOutstanding) * 10000) / 100
    : 0

  return {
    reportType: 'CDF-1 Monthly Return',
    generatedAt: new Date().toISOString(),
    summary: {
      totalActiveLoanAccounts: activeLoans,
      totalBorrowers: totalBorrowers.length,
      totalDisbursed: Number(loanPortfolio._sum.principalAmount || 0),
      outstandingPortfolio: totalOutstanding,
      totalRepayable,
      totalRecovered: totalPaid,
      recoveryRate,
      savingsPortfolio: Number(savingsPortfolio._sum.balance || 0),
      totalSavingsAccounts: savingsPortfolio._count,
      totalDeposited: Number(savingsPortfolio._sum.totalDeposited || 0),
      totalWithdrawn: Number(savingsPortfolio._sum.totalWithdrawn || 0),
      currentMonthRepayments: {
        count: repaymentStats._count,
        amount: Number(repaymentStats._sum.totalAmount || 0),
      },
      par30: {
        count: par30Loans._count,
        outstanding: par30Outstanding,
        rate: parRate,
      },
    },
  }
}

/**
 * Portfolio Quality: PAR analysis by loan classification
 */
async function generatePortfolioQuality(memberIds: string[]) {
  const memberFilter = { memberId: { in: memberIds } }

  const classifications = ['REGULAR', 'WATCH', 'SUBSTANDARD', 'DOUBTFUL', 'BAD'] as const

  const classificationData = await Promise.all(
    classifications.map(async (cls) => {
      const agg = await prisma.loanAccount.aggregate({
        where: { ...memberFilter, status: 'ACTIVE', classification: cls },
        _count: true,
        _sum: { outstandingBalance: true, overdueAmount: true },
      })
      return {
        classification: cls,
        count: agg._count,
        outstandingBalance: Number(agg._sum.outstandingBalance || 0),
        overdueAmount: Number(agg._sum.overdueAmount || 0),
      }
    })
  )

  const totalOutstanding = classificationData.reduce((sum, c) => sum + c.outstandingBalance, 0)
  const totalAccounts = classificationData.reduce((sum, c) => sum + c.count, 0)

  // PAR breakdown by days overdue
  const parBands = [
    { label: 'PAR 1-30', min: 1, max: 30 },
    { label: 'PAR 31-90', min: 31, max: 90 },
    { label: 'PAR 91-180', min: 91, max: 180 },
    { label: 'PAR 181-365', min: 181, max: 365 },
    { label: 'PAR 365+', min: 366, max: 99999 },
  ]

  const parAnalysis = await Promise.all(
    parBands.map(async (band) => {
      const agg = await prisma.loanAccount.aggregate({
        where: {
          ...memberFilter,
          status: 'ACTIVE',
          daysOverdue: { gte: band.min, lte: band.max },
        },
        _count: true,
        _sum: { outstandingBalance: true },
      })
      const outstanding = Number(agg._sum.outstandingBalance || 0)
      return {
        band: band.label,
        count: agg._count,
        outstanding,
        percentage: totalOutstanding > 0
          ? Math.round((outstanding / totalOutstanding) * 10000) / 100
          : 0,
      }
    })
  )

  return {
    reportType: 'Portfolio Quality Analysis',
    generatedAt: new Date().toISOString(),
    totalActiveAccounts: totalAccounts,
    totalOutstandingPortfolio: totalOutstanding,
    byClassification: classificationData.map((c) => ({
      ...c,
      percentage: totalOutstanding > 0
        ? Math.round((c.outstandingBalance / totalOutstanding) * 10000) / 100
        : 0,
    })),
    parAnalysis,
    atRiskPortfolio: {
      count: classificationData
        .filter((c) => c.classification !== 'REGULAR')
        .reduce((sum, c) => sum + c.count, 0),
      amount: classificationData
        .filter((c) => c.classification !== 'REGULAR')
        .reduce((sum, c) => sum + c.outstandingBalance, 0),
      percentage: totalOutstanding > 0
        ? Math.round(
            (classificationData
              .filter((c) => c.classification !== 'REGULAR')
              .reduce((sum, c) => sum + c.outstandingBalance, 0) /
              totalOutstanding) *
              10000
          ) / 100
        : 0,
    },
  }
}
