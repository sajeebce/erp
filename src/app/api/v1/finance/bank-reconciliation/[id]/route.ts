import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
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

    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        bankAccount: {
          organizationId: auth.organizationId,
        },
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
            branchName: true,
          },
        },
        items: {
          select: {
            id: true,
            date: true,
            description: true,
            reference: true,
            bookAmount: true,
            bankAmount: true,
            isMatched: true,
            matchedJournalId: true,
            type: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!reconciliation) {
      return apiNotFound('Bank reconciliation not found')
    }

    return apiSuccess(reconciliation)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        bankAccount: {
          organizationId: auth.organizationId,
        },
      },
      include: {
        bankAccount: true,
      },
    })

    if (!existing) {
      return apiNotFound('Bank reconciliation not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.notes !== undefined) {
      data.notes = body.notes
    }

    if (body.status !== undefined) {
      const validStatuses = ['PENDING', 'RECONCILED', 'DISCREPANCY']
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status

      if (body.status === 'RECONCILED') {
        data.reconciledAt = new Date()
        data.reconciledById = auth.userId
      }
    }

    // If bankBalance is updated, recalculate difference
    if (body.bankBalance !== undefined) {
      const numericBankBalance = Number(body.bankBalance)
      if (isNaN(numericBankBalance)) {
        return apiBadRequest('bankBalance must be a valid number')
      }

      data.bankBalance = numericBankBalance

      // Recalculate book balance from vouchers/JE in the period
      const journalAgg = await prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            status: 'APPROVED',
            deletedAt: null,
            date: {
              gte: existing.periodStart,
              lte: existing.periodEnd,
            },
            voucher: {
              bankAccountId: existing.bankAccountId,
            },
          },
        },
        _sum: {
          debit: true,
          credit: true,
        },
      })

      const totalDebit = Number(journalAgg._sum.debit ?? 0)
      const totalCredit = Number(journalAgg._sum.credit ?? 0)

      let bookBalance: number

      if (journalAgg._sum.debit !== null || journalAgg._sum.credit !== null) {
        bookBalance = totalDebit - totalCredit
      } else {
        const voucherAgg = await prisma.voucher.aggregate({
          where: {
            bankAccountId: existing.bankAccountId,
            date: {
              gte: existing.periodStart,
              lte: existing.periodEnd,
            },
            status: 'APPROVED',
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        })
        bookBalance = Number(voucherAgg._sum.amount ?? 0)
      }

      data.bookBalance = bookBalance
      data.difference = numericBankBalance - bookBalance
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.bankReconciliation.update({
      where: { id },
      data,
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
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
