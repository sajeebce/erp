import { Prisma } from '@prisma/client'

interface BudgetScopeInput {
  budgetLineIds: string[]
  accountIds: string[]
  businessUnitId?: string | null
  costCenterId?: string | null
  fundClassId?: string | null
  projectId?: string | null
}

function withOptionalScope<T extends Prisma.JournalEntryLineWhereInput>(base: T, scope: BudgetScopeInput) {
  return {
    ...base,
    ...(scope.businessUnitId ? { businessUnitId: scope.businessUnitId } : {}),
    ...(scope.costCenterId ? { costCenterId: scope.costCenterId } : {}),
    ...(scope.fundClassId ? { fundClassId: scope.fundClassId } : {}),
    ...(scope.projectId ? { projectId: scope.projectId } : {}),
  }
}

export function buildBudgetActualWhere(scope: BudgetScopeInput): Prisma.JournalEntryLineWhereInput {
  return {
    journalEntry: { status: 'APPROVED', deletedAt: null },
    OR: [
      ...(scope.budgetLineIds.length > 0 ? [{ budgetLineId: { in: scope.budgetLineIds } }] : []),
      ...(scope.accountIds.length > 0
        ? [withOptionalScope({ accountId: { in: scope.accountIds } }, scope)]
        : []),
    ],
  }
}
