import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export interface ProcurementBudgetInput {
  organizationId: string
  requisitionId?: string | null
  budgetId?: string | null
  businessUnitId?: string | null
  costCenterId?: string | null
  fundClassId?: string | null
  projectId?: string | null
  grantId?: string | null
  totalEstimate: number
}

export interface ProcurementBudgetCheck {
  status: 'WITHIN_BUDGET' | 'WARNING' | 'NO_BUDGET' | 'NOT_CHECKED'
  message: string | null
  budgetId: string | null
  budgetAmount: number
  committedAmount: number
  actualAmount: number
  availableAmount: number
  varianceAmount: number
}

function optionalMatch<T>(value: T | null | undefined) {
  return value ? value : null
}

export async function checkProcurementBudget(input: ProcurementBudgetInput): Promise<ProcurementBudgetCheck> {
  const totalEstimate = Number(input.totalEstimate || 0)

  const budget = input.budgetId
    ? await prisma.budget.findFirst({
        where: {
          id: input.budgetId,
          deletedAt: null,
          project: input.projectId ? { organizationId: input.organizationId } : undefined,
          OR: [
            { project: { organizationId: input.organizationId } },
            { businessUnit: { organizationId: input.organizationId } },
          ],
        },
        include: { lines: true },
      })
    : await prisma.budget.findFirst({
        where: {
          deletedAt: null,
          status: { in: ['APPROVED', 'ACTIVE'] },
          businessUnitId: optionalMatch(input.businessUnitId),
          costCenterId: optionalMatch(input.costCenterId),
          fundClassId: optionalMatch(input.fundClassId),
          projectId: optionalMatch(input.projectId),
          grantId: optionalMatch(input.grantId),
          OR: [
            { project: { organizationId: input.organizationId } },
            { businessUnit: { organizationId: input.organizationId } },
          ],
        },
        include: { lines: true },
        orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
      })

  if (!budget || !['APPROVED', 'ACTIVE'].includes(budget.status)) {
    return {
      status: 'NO_BUDGET',
      message: 'No approved or active budget found for this concern scope. Admin may still approve with warning.',
      budgetId: null,
      budgetAmount: 0,
      committedAmount: 0,
      actualAmount: 0,
      availableAmount: 0,
      varianceAmount: totalEstimate,
    }
  }

  const budgetLineIds = budget.lines.map((line) => line.id)
  const accountIds = budget.lines.map((line) => line.accountId)
  const budgetAmount = Number(budget.totalAmount)

  const [commitment, actual] = await Promise.all([
    prisma.purchaseRequisition.aggregate({
      where: {
        id: input.requisitionId ? { not: input.requisitionId } : undefined,
        deletedAt: null,
        status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED', 'PO_CREATED'] },
        OR: [
          { budgetId: budget.id },
          {
            businessUnitId: budget.businessUnitId,
            costCenterId: budget.costCenterId,
            fundClassId: budget.fundClassId,
            projectId: budget.projectId,
          },
        ],
      },
      _sum: { totalEstimate: true },
    }),
    prisma.journalEntryLine.aggregate({
      where: {
        debit: { gt: new Prisma.Decimal(0) },
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
        },
        OR: [
          ...(budgetLineIds.length > 0 ? [{ budgetLineId: { in: budgetLineIds } }] : []),
          {
            accountId: { in: accountIds },
            businessUnitId: budget.businessUnitId,
            costCenterId: budget.costCenterId,
            fundClassId: budget.fundClassId,
            projectId: budget.projectId,
          },
        ],
      },
      _sum: { debit: true },
    }),
  ])

  const committedAmount = Number(commitment._sum.totalEstimate || 0)
  const actualAmount = Number(actual._sum.debit || 0)
  const availableAmount = budgetAmount - committedAmount - actualAmount
  const varianceAmount = totalEstimate - availableAmount

  if (totalEstimate > availableAmount) {
    return {
      status: 'WARNING',
      message: `Requested amount (${totalEstimate.toFixed(2)}) exceeds available concern budget (${availableAmount.toFixed(2)}). Admin may approve with warning.`,
      budgetId: budget.id,
      budgetAmount,
      committedAmount,
      actualAmount,
      availableAmount,
      varianceAmount,
    }
  }

  return {
    status: 'WITHIN_BUDGET',
    message: null,
    budgetId: budget.id,
    budgetAmount,
    committedAmount,
    actualAmount,
    availableAmount,
    varianceAmount: 0,
  }
}
