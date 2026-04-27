import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    // ── Determine fiscal year boundaries ──
    const currentFY = await prisma.fiscalYear.findFirst({
      where: { organizationId: orgId, isCurrent: true },
      select: { id: true, startDate: true, endDate: true },
    })

    const now = new Date()
    const currentYearStart = currentFY?.startDate ?? new Date(now.getFullYear(), 0, 1)
    const currentYearEnd = currentFY?.endDate ?? new Date(now.getFullYear(), 11, 31)

    // Previous fiscal year: shift back by 1 year
    const prevYearStart = new Date(currentYearStart)
    prevYearStart.setFullYear(prevYearStart.getFullYear() - 1)
    const prevYearEnd = new Date(currentYearEnd)
    prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1)

    // ── Parallel queries ──
    const [
      currentIncome,
      currentExpenses,
      prevIncome,
      prevExpenses,
      currentBeneficiaries,
      prevBeneficiaries,
      currentProjects,
      prevProjects,
      projectPerformance,
      budgetData,
    ] = await Promise.all([
      // Current year income (credits on INCOME accounts from APPROVED JEs)
      prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            date: { gte: currentYearStart, lte: currentYearEnd },
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: 'INCOME' },
        },
        _sum: { credit: true },
      }),

      // Current year expenses (debits on EXPENSE accounts from APPROVED JEs)
      prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            date: { gte: currentYearStart, lte: currentYearEnd },
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: 'EXPENSE' },
        },
        _sum: { debit: true },
      }),

      // Previous year income
      prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            date: { gte: prevYearStart, lte: prevYearEnd },
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: 'INCOME' },
        },
        _sum: { credit: true },
      }),

      // Previous year expenses
      prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            date: { gte: prevYearStart, lte: prevYearEnd },
            fiscalYear: { organizationId: orgId },
            deletedAt: null,
          },
          account: { type: 'EXPENSE' },
        },
        _sum: { debit: true },
      }),

      // Current year beneficiary enrollments (distinct)
      prisma.beneficiaryEnrollment.findMany({
        where: {
          enrollmentDate: { gte: currentYearStart, lte: currentYearEnd },
          project: { organizationId: orgId, deletedAt: null },
        },
        select: { beneficiaryId: true },
        distinct: ['beneficiaryId'],
      }),

      // Previous year beneficiary enrollments (distinct)
      prisma.beneficiaryEnrollment.findMany({
        where: {
          enrollmentDate: { gte: prevYearStart, lte: prevYearEnd },
          project: { organizationId: orgId, deletedAt: null },
        },
        select: { beneficiaryId: true },
        distinct: ['beneficiaryId'],
      }),

      // Current year active projects
      prisma.project.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: { lte: currentYearEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: currentYearStart } },
          ],
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      }),

      // Previous year active projects
      prisma.project.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: { lte: prevYearEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: prevYearStart } },
          ],
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      }),

      // Top performing projects (ranked by progress and budget efficiency)
      prisma.project.findMany({
        where: {
          organizationId: orgId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          projectNo: true,
          name: true,
          progress: true,
          totalBudget: true,
          amountSpent: true,
          startDate: true,
          endDate: true,
        },
        orderBy: [{ progress: 'desc' }],
        take: 10,
      }),

      // Budget utilization data
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
          lines: {
            select: {
              category: true,
              totalAmount: true,
            },
          },
        },
      }),
    ])

    // ── Compute year-over-year ──
    const curIncome = Number(currentIncome._sum.credit ?? 0)
    const curExpenses = Number(currentExpenses._sum.debit ?? 0)
    const prvIncome = Number(prevIncome._sum.credit ?? 0)
    const prvExpenses = Number(prevExpenses._sum.debit ?? 0)

    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 10000) / 100
    }

    const curBeneficiaryCount = currentBeneficiaries.length
    const prvBeneficiaryCount = prevBeneficiaries.length

    // ── Top performing projects with efficiency score ──
    const topPerformingProjects = projectPerformance.map((p) => {
      const totalBudget = Number(p.totalBudget)
      const amountSpent = Number(p.amountSpent)
      const burnRate = totalBudget > 0
        ? Math.round((amountSpent / totalBudget) * 10000) / 100
        : 0
      // Efficiency: high progress with low burn rate is efficient
      const efficiency = p.progress > 0 && burnRate > 0
        ? Math.round((p.progress / burnRate) * 100) / 100
        : 0

      return {
        id: p.id,
        projectNo: p.projectNo,
        name: p.name,
        progress: p.progress,
        totalBudget,
        amountSpent,
        burnRate,
        efficiency,
        startDate: p.startDate,
        endDate: p.endDate,
      }
    }).sort((a, b) => b.efficiency - a.efficiency)

    // ── Budget utilization ──
    const totalBudget = budgetData.reduce(
      (sum, b) => sum + Number(b.totalAmount), 0
    )
    const totalSpent = budgetData.reduce(
      (sum, b) => sum + Number(b.project?.amountSpent ?? 0), 0
    )
    const totalRemaining = totalBudget - totalSpent
    const budgetUtilizationRate = totalBudget > 0
      ? Math.round((totalSpent / totalBudget) * 10000) / 100
      : 0

    // Aggregate by category from budget lines
    const categoryMap = new Map<string, { budget: number; actual: number }>()
    for (const b of budgetData) {
      const projectSpentRatio =
        Number(b.totalAmount) > 0
          ? Number(b.project?.amountSpent ?? 0) / Number(b.totalAmount)
          : 0

      for (const line of b.lines) {
        const cat = line.category
        const existing = categoryMap.get(cat) ?? { budget: 0, actual: 0 }
        const lineBudget = Number(line.totalAmount)
        existing.budget += lineBudget
        // Estimate actual spend per category proportionally
        existing.actual += lineBudget * projectSpentRatio
        categoryMap.set(cat, existing)
      }
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        budget: Math.round(data.budget * 100) / 100,
        actual: Math.round(data.actual * 100) / 100,
        variance: Math.round((data.budget - data.actual) * 100) / 100,
      })
    )

    return apiSuccess({
      yearOverYear: {
        currentYear: {
          income: curIncome,
          expenses: curExpenses,
          surplus: Math.round((curIncome - curExpenses) * 100) / 100,
          beneficiaries: curBeneficiaryCount,
          projects: currentProjects,
        },
        previousYear: {
          income: prvIncome,
          expenses: prvExpenses,
          surplus: Math.round((prvIncome - prvExpenses) * 100) / 100,
          beneficiaries: prvBeneficiaryCount,
          projects: prevProjects,
        },
        growth: {
          incomeGrowth: calcGrowth(curIncome, prvIncome),
          expenseGrowth: calcGrowth(curExpenses, prvExpenses),
          beneficiaryGrowth: calcGrowth(curBeneficiaryCount, prvBeneficiaryCount),
          projectGrowth: calcGrowth(currentProjects, prevProjects),
        },
      },
      topPerformingProjects,
      budgetUtilization: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        utilizationRate: budgetUtilizationRate,
        byCategory,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
