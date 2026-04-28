import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { buildBudgetActualWhere } from '@/lib/budget-actuals'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Fetch budget with lines
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { project: { organizationId: auth.organizationId } },
          { businessUnit: { organizationId: auth.organizationId } },
        ],
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        businessUnit: {
          select: { id: true, code: true, name: true, shortName: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        costCenter: {
          select: { id: true, name: true, code: true },
        },
        fundClass: {
          select: { id: true, name: true, code: true },
        },
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!budget) {
      return apiNotFound('Budget not found')
    }

    const budgetLineIds = budget.lines.map((line) => line.id)
    const accountIds = [...new Set(budget.lines.map((line) => line.accountId))]
    const overallActualAggregate = await prisma.journalEntryLine.aggregate({
      where: buildBudgetActualWhere({
        budgetLineIds,
        accountIds,
        businessUnitId: budget.businessUnitId,
        costCenterId: budget.costCenterId,
        fundClassId: budget.fundClassId,
        projectId: budget.projectId,
      }),
      _sum: { debit: true },
    })

    // Get actual spend from APPROVED journal entry lines by budgetLineId first,
    // then by account + budget dimensions for older records.
    const lineAnalysis = await Promise.all(
      budget.lines.map(async (line) => {
        const actualAggregate = await prisma.journalEntryLine.aggregate({
          where: {
            journalEntry: { status: 'APPROVED', deletedAt: null },
            OR: [
              { budgetLineId: line.id },
              {
                accountId: line.accountId,
                businessUnitId: line.businessUnitId || budget.businessUnitId,
                costCenterId: line.costCenterId || budget.costCenterId,
                fundClassId: line.fundClassId || budget.fundClassId,
                projectId: line.projectId || budget.projectId,
              },
            ],
          },
          _sum: { debit: true },
        })

        const budgetAmount = Number(line.totalAmount)
        const actualSpent = Number(actualAggregate._sum.debit ?? 0)
        const variance = budgetAmount - actualSpent
        const variancePercent = budgetAmount > 0
          ? Math.round((actualSpent / budgetAmount) * 10000) / 100
          : 0

        let status: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET'
        if (variancePercent > 100) {
          status = 'OVER_BUDGET'
        } else if (variancePercent >= 90) {
          status = 'ON_TRACK'
        } else {
          status = 'UNDER_BUDGET'
        }

        return {
          id: line.id,
          accountId: line.accountId,
          account: line.account,
          category: line.category,
          description: line.description,
          budgetAmount,
          actualSpent,
          variance,
          variancePercent,
          status,
        }
      })
    )

    // Calculate totals
    const totalBudget = lineAnalysis.reduce((sum, l) => sum + l.budgetAmount, 0)
    const totalActual = Number(overallActualAggregate._sum.debit ?? 0)
    const totalVariance = totalBudget - totalActual
    const overallUtilizationPercent = totalBudget > 0
      ? Math.round((totalActual / totalBudget) * 10000) / 100
      : 0

    const overallStatus = overallUtilizationPercent > 100
      ? 'OVER_BUDGET'
      : overallUtilizationPercent >= 80
        ? 'AT_RISK'
        : 'ON_TRACK'

    const overBudgetLines = lineAnalysis.filter((l) => l.status === 'OVER_BUDGET')
    const atRiskLines = lineAnalysis.filter((l) => l.variancePercent >= 80 && l.status !== 'OVER_BUDGET')

    return apiSuccess({
      budgetId: budget.id,
      budgetName: budget.name,
      budgetCode: budget.budgetCode,
      project: budget.project,
      businessUnit: budget.businessUnit ?? null,
      department: budget.department ?? null,
      costCenter: budget.costCenter ?? null,
      fundClass: budget.fundClass ?? null,
      currencyCode: budget.currencyCode,
      varianceThreshold: Number(budget.varianceThreshold),
      lines: lineAnalysis,
      totals: {
        totalBudget,
        totalActual,
        totalVariance,
        overallUtilizationPercent,
        overallStatus,
      },
      alerts: {
        overBudgetCount: overBudgetLines.length,
        atRiskCount: atRiskLines.length,
        overBudgetLines: overBudgetLines.map((l) => ({ id: l.id, description: l.description, variancePercent: l.variancePercent })),
        atRiskLines: atRiskLines.map((l) => ({ id: l.id, description: l.description, variancePercent: l.variancePercent })),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
