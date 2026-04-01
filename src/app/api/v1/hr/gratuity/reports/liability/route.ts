import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Aggregate liability
    const aggregate = await prisma.gratuityLedger.aggregate({
      where: { organizationId: auth.organizationId, isActive: true },
      _sum: { currentBalance: true },
    })

    // Monthly accrual: sum accrual amounts for the current month
    const monthlyAccrualAgg = await prisma.gratuityAccrual.aggregate({
      where: {
        organizationId: auth.organizationId,
        accrualMonth: currentMonth,
        accrualYear: currentYear,
      },
      _sum: { accrualAmount: true },
    })
    const monthlyAccrual = monthlyAccrualAgg._sum.accrualAmount
      ? Number(monthlyAccrualAgg._sum.accrualAmount)
      : 0

    // Fund balance: sum of all active fund balances
    const fundAgg = await prisma.gratuityFund.aggregate({
      where: { organizationId: auth.organizationId, isActive: true },
      _sum: { currentBalance: true },
    })
    const fundBalance = fundAgg._sum.currentBalance
      ? Number(fundAgg._sum.currentBalance)
      : 0

    // Vested employee count
    const vestedEmployees = await prisma.gratuityLedger.count({
      where: { organizationId: auth.organizationId, isActive: true, isVested: true },
    })

    // Recent accruals (last 10)
    const recentAccruals = await prisma.gratuityAccrual.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        ledger: {
          include: {
            employee: { select: { fullName: true } },
          },
        },
      },
    })

    // Recent payments (last 10)
    const recentPayments = await prisma.gratuityPayment.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        ledger: {
          include: {
            employee: { select: { fullName: true } },
          },
        },
      },
    })

    return apiSuccess({
      totalLiability: Number(aggregate._sum.currentBalance ?? 0),
      monthlyAccrual,
      fundBalance,
      vestedEmployees,
      recentAccruals: recentAccruals.map((a) => ({
        id: a.id,
        employeeName: a.ledger.employee.fullName,
        month: a.accrualMonth,
        year: a.accrualYear,
        accrualAmount: Number(a.accrualAmount),
        createdAt: a.createdAt.toISOString(),
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        paymentNo: p.paymentNo,
        employeeName: p.ledger.employee.fullName,
        paymentType: p.paymentType,
        amount: Number(p.amount),
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
