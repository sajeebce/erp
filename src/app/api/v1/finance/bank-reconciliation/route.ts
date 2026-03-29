import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // Tenant isolation: join through bankAccount.organizationId
    const where: Record<string, unknown> = {
      bankAccount: {
        organizationId: auth.organizationId,
      },
    }

    const bankAccountId = url.searchParams.get('bankAccountId')
    if (bankAccountId) {
      where.bankAccountId = bankAccountId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [reconciliations, total] = await Promise.all([
      prisma.bankReconciliation.findMany({
        where,
        select: {
          id: true,
          bankAccountId: true,
          periodStart: true,
          periodEnd: true,
          bookBalance: true,
          bankBalance: true,
          difference: true,
          status: true,
          reconciledById: true,
          reconciledAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          bankAccount: {
            select: {
              id: true,
              accountCode: true,
              accountName: true,
              bankName: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.bankReconciliation.count({ where }),
    ])

    return apiPaginated(reconciliations, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { bankAccountId, periodStart, periodEnd, bankBalance } = body

    if (!bankAccountId || !periodStart || !periodEnd || bankBalance === undefined) {
      return apiBadRequest('bankAccountId, periodStart, periodEnd, and bankBalance are required')
    }

    const start = new Date(periodStart)
    const end = new Date(periodEnd)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return apiBadRequest('periodStart and periodEnd must be valid dates')
    }

    if (start >= end) {
      return apiBadRequest('periodStart must be before periodEnd')
    }

    // Verify bank account belongs to this org
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        organizationId: auth.organizationId,
      },
    })

    if (!bankAccount) {
      return apiNotFound('Bank account not found in this organization')
    }

    // Calculate bookBalance from approved JE lines for the specific GL account (or all bank accounts as fallback)
    const jeWhere: Record<string, unknown> = {
      journalEntry: {
        status: 'APPROVED',
        deletedAt: null,
        date: { gte: start, lte: end },
      },
    }

    if (bankAccount.glAccountId) {
      jeWhere.accountId = bankAccount.glAccountId
    } else {
      jeWhere.account = { organizationId: auth.organizationId, isBankAccount: true }
    }

    const journalAgg = await prisma.journalEntryLine.aggregate({
      where: jeWhere,
      _sum: { debit: true, credit: true },
    })

    // Bank is an ASSET account: debit increases, credit decreases
    const totalDebit = Number(journalAgg._sum.debit ?? 0)
    const totalCredit = Number(journalAgg._sum.credit ?? 0)
    const bookBalance = totalDebit - totalCredit

    const numericBankBalance = Number(bankBalance)
    const difference = numericBankBalance - bookBalance

    const reconciliation = await prisma.bankReconciliation.create({
      data: {
        bankAccountId,
        periodStart: start,
        periodEnd: end,
        bookBalance,
        bankBalance: numericBankBalance,
        difference,
        status: 'PENDING',
        reconciledById: auth.userId,
      },
      select: {
        id: true,
        bankAccountId: true,
        periodStart: true,
        periodEnd: true,
        bookBalance: true,
        bankBalance: true,
        difference: true,
        status: true,
        reconciledById: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        bankAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            bankName: true,
          },
        },
      },
    })

    return apiCreated(reconciliation)
  } catch (error) {
    return handleRouteError(error)
  }
}
