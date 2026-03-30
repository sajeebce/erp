import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const trust = await prisma.pFTrust.findFirst({
      where: { organizationId: auth.organizationId, isActive: true },
      include: {
        investments: true,
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
      },
    })

    // Aggregate member balances
    const memberAgg = await prisma.pFEnrollment.aggregate({
      where: { organizationId: auth.organizationId },
      _sum: {
        totalEmployeeContrib: true,
        totalEmployerContrib: true,
        totalInterest: true,
        totalWithdrawals: true,
        totalLoanOutstanding: true,
        currentBalance: true,
      },
      _count: true,
    })

    // Investment summary
    const activeInvestments = trust?.investments.filter((i) => i.status === 'ACTIVE') || []
    const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalCurrentValue = activeInvestments.reduce((sum, i) => sum + Number(i.currentValue), 0)

    return apiSuccess({
      trust: trust ? {
        id: trust.id,
        name: trust.name,
        registrationNo: trust.registrationNo,
        currentBalance: trust.currentBalance.toString(),
      } : null,
      memberSummary: {
        totalMembers: memberAgg._count,
        totalEmployeeContrib: memberAgg._sum.totalEmployeeContrib?.toString() || '0',
        totalEmployerContrib: memberAgg._sum.totalEmployerContrib?.toString() || '0',
        totalInterest: memberAgg._sum.totalInterest?.toString() || '0',
        totalWithdrawals: memberAgg._sum.totalWithdrawals?.toString() || '0',
        totalLoanOutstanding: memberAgg._sum.totalLoanOutstanding?.toString() || '0',
        totalMemberBalance: memberAgg._sum.currentBalance?.toString() || '0',
      },
      investments: {
        activeCount: activeInvestments.length,
        totalInvested: totalInvested.toString(),
        totalCurrentValue: totalCurrentValue.toString(),
        details: activeInvestments,
      },
      recentTransactions: trust?.transactions || [],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
