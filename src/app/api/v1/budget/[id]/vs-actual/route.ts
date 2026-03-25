import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
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
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, name: true },
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

    // Get actual spend for each budget line from APPROVED journal entry lines
    // where accountId matches and projectId matches the budget's project
    const lineAnalysis = await Promise.all(
      budget.lines.map(async (line) => {
        const actualAggregate = await prisma.journalEntryLine.aggregate({
          where: {
            accountId: line.accountId,
            journalEntry: {
              status: 'APPROVED',
              projectId: budget.projectId,
              deletedAt: null,
            },
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
    const totalActual = lineAnalysis.reduce((sum, l) => sum + l.actualSpent, 0)
    const totalVariance = totalBudget - totalActual
    const overallUtilizationPercent = totalBudget > 0
      ? Math.round((totalActual / totalBudget) * 10000) / 100
      : 0

    return apiSuccess({
      budgetId: budget.id,
      budgetName: budget.name,
      project: budget.project,
      currencyCode: budget.currencyCode,
      lines: lineAnalysis,
      totals: {
        totalBudget,
        totalActual,
        totalVariance,
        overallUtilizationPercent,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
