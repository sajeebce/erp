import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // ── Parallel KPI queries ──
    const [
      totalFundReceivedAgg,
      fundUtilizedResult,
      activeProjects,
      activeBeneficiaries,
      draftVouchers,
      draftRequisitions,
      pendingLeaves,
      staffCount,
      topProjects,
      monthlyJELines,
      topDonors,
      activeProjectsList,
      activeBudgets,
      beneficiaryEnrollments,
      recentTransactions,
      upcomingDeadlines,
    ] = await Promise.all([
      // 1. Total fund received (CONFIRMED FundReceipts)
      prisma.fundReceipt.aggregate({
        where: {
          organizationId: orgId,
          status: 'CONFIRMED',
          deletedAt: null,
        },
        _sum: { amountInBDT: true },
      }),

      // 2. Fund utilized: sum of debits on EXPENSE accounts from APPROVED JEs
      prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: 'EXPENSE' },
        },
        _sum: { debit: true },
      }),

      // 3. Active projects
      prisma.project.count({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
      }),

      // 4. Active beneficiaries (distinct beneficiary from ACTIVE enrollments)
      prisma.beneficiaryEnrollment.findMany({
        where: {
          status: 'ACTIVE',
          project: { organizationId: orgId, deletedAt: null },
        },
        select: { beneficiaryId: true },
        distinct: ['beneficiaryId'],
      }),

      // 5. Pending approvals: DRAFT vouchers
      prisma.voucher.count({
        where: { organizationId: orgId, status: 'DRAFT', deletedAt: null },
      }),

      // 6. Pending approvals: DRAFT fund requisitions
      prisma.fundRequisition.count({
        where: {
          status: 'DRAFT',
          project: { organizationId: orgId },
        },
      }),

      // 7. Pending approvals: PENDING leave applications
      prisma.leaveApplication.count({
        where: {
          status: 'PENDING',
          employee: { organizationId: orgId },
        },
      }),

      // 8. Staff count (ACTIVE employees)
      prisma.employee.count({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
      }),

      // 9. Top 5 projects with budget and spend
      prisma.project.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: {
          id: true,
          name: true,
          totalBudget: true,
          amountSpent: true,
        },
        orderBy: { totalBudget: 'desc' },
        take: 5,
      }),

      // 10. Monthly income/expense from JE lines (last 6 months)
      prisma.journalEntryLine.findMany({
        where: {
          journalEntry: {
            status: 'APPROVED',
            date: { gte: sixMonthsAgo },
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: { in: ['EXPENSE', 'INCOME'] } },
        },
        select: {
          debit: true,
          credit: true,
          account: { select: { type: true } },
          journalEntry: { select: { date: true } },
        },
      }),

      // 11. Top 5 donors by totalFunded
      prisma.donor.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: { id: true, name: true, totalFunded: true },
        orderBy: { totalFunded: 'desc' },
        take: 5,
      }),

      // 12. Active projects with progress for chart
      prisma.project.findMany({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
        select: {
          id: true,
          name: true,
          progress: true,
          status: true,
        },
        orderBy: { progress: 'desc' },
      }),

      // 13. Active budgets with totalAmount
      prisma.budget.findMany({
        where: {
          status: { in: ['ACTIVE', 'APPROVED'] },
          project: { organizationId: orgId, deletedAt: null },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          totalAmount: true,
          project: {
            select: { name: true, amountSpent: true },
          },
        },
      }),

      // 14. Beneficiary enrollments in last 6 months
      prisma.beneficiaryEnrollment.findMany({
        where: {
          enrollmentDate: { gte: sixMonthsAgo },
          project: { organizationId: orgId, deletedAt: null },
        },
        select: { enrollmentDate: true },
      }),

      // 15. Recent transactions (last 10 approved JEs)
      prisma.journalEntry.findMany({
        where: {
          status: 'APPROVED',
          fiscalYear: { organizationId: orgId },
          deletedAt: null,
        },
        select: {
          entryNo: true,
          date: true,
          description: true,
          totalDebit: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),

      // 16. Upcoming deadlines (donor reports due in next 30 days)
      prisma.donorReport.findMany({
        where: {
          dueDate: { gte: now, lte: thirtyDaysFromNow },
          status: { in: ['DRAFT', 'UNDER_REVIEW'] },
          grant: {
            donor: { organizationId: orgId },
          },
        },
        select: {
          reportNo: true,
          type: true,
          dueDate: true,
          status: true,
          grant: {
            select: {
              title: true,
              donor: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ])

    // ── Compute KPIs ──
    const totalFundReceived = Number(totalFundReceivedAgg._sum.amountInBDT ?? 0)
    const fundUtilized = Number(fundUtilizedResult._sum.debit ?? 0)
    const utilizationRate =
      totalFundReceived > 0
        ? Math.round((fundUtilized / totalFundReceived) * 10000) / 100
        : 0
    const pendingApprovals = draftVouchers + draftRequisitions + pendingLeaves

    // ── Build monthlyIncomeExpense chart ──
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, { income: 0, expenses: 0 })
    }

    for (const line of monthlyJELines) {
      const date = new Date(line.journalEntry.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const entry = monthlyMap.get(key)
      if (!entry) continue

      if (line.account.type === 'EXPENSE') {
        entry.expenses += Number(line.debit)
      } else if (line.account.type === 'INCOME') {
        entry.income += Number(line.credit)
      }
    }

    const monthlyIncomeExpense = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
      })
    )

    // ── Build beneficiaryGrowth chart ──
    const growthMap = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      growthMap.set(key, 0)
    }

    for (const enrollment of beneficiaryEnrollments) {
      const date = new Date(enrollment.enrollmentDate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const current = growthMap.get(key)
      if (current !== undefined) {
        growthMap.set(key, current + 1)
      }
    }

    const beneficiaryGrowth = Array.from(growthMap.entries()).map(
      ([month, count]) => ({ month, newEnrollments: count })
    )

    return apiSuccess({
      kpis: {
        totalFundReceived,
        fundUtilized,
        utilizationRate,
        activeProjects,
        activeBeneficiaries: activeBeneficiaries.length,
        pendingApprovals,
        staffCount,
        complianceScore: 95,
      },
      charts: {
        fundByProject: topProjects.map((p) => ({
          id: p.id,
          name: p.name,
          totalBudget: Number(p.totalBudget),
          amountSpent: Number(p.amountSpent),
        })),
        monthlyIncomeExpense,
        donorContributions: topDonors.map((d) => ({
          id: d.id,
          name: d.name,
          totalFunded: Number(d.totalFunded),
        })),
        projectProgress: activeProjectsList.map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          status: p.status,
        })),
        budgetVsActual: activeBudgets.map((b) => ({
          id: b.id,
          name: b.name,
          budgetAmount: Number(b.totalAmount),
          actualSpend: Number(b.project.amountSpent),
        })),
        beneficiaryGrowth,
      },
      recentTransactions: recentTransactions.map((t) => ({
        entryNo: t.entryNo,
        date: t.date,
        description: t.description,
        amount: Number(t.totalDebit),
      })),
      upcomingDeadlines: upcomingDeadlines.map((r) => ({
        reportNo: r.reportNo,
        type: r.type,
        dueDate: r.dueDate,
        status: r.status,
        grantTitle: r.grant.title,
        donorName: r.grant.donor.name,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
