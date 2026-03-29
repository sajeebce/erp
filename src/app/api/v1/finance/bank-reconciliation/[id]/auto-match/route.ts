import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const reconciliation = await prisma.bankReconciliation.findFirst({
      where: {
        id,
        bankAccount: { organizationId: auth.organizationId },
      },
      include: {
        items: { where: { isMatched: false } },
        bankAccount: true,
      },
    })
    if (!reconciliation) return apiNotFound('Reconciliation not found')

    // Get approved journal entry lines for the specific GL account (or all bank accounts as fallback)
    const bookEntriesWhere: Record<string, unknown> = {
      journalEntry: {
        status: 'APPROVED',
        deletedAt: null,
        date: {
          gte: reconciliation.periodStart,
          lte: reconciliation.periodEnd,
        },
      },
    }

    if (reconciliation.bankAccount.glAccountId) {
      bookEntriesWhere.accountId = reconciliation.bankAccount.glAccountId
    } else {
      bookEntriesWhere.account = { organizationId: auth.organizationId, isBankAccount: true }
    }

    const bookEntries = await prisma.journalEntryLine.findMany({
      where: bookEntriesWhere,
      include: {
        journalEntry: {
          select: {
            id: true,
            entryNo: true,
            date: true,
            description: true,
            reference: true,
          },
        },
      },
    })

    let matchCount = 0

    for (const bankItem of reconciliation.items) {
      if (bankItem.isMatched || !bankItem.bankAmount) continue
      const bankAmt = Number(bankItem.bankAmount)

      // Try to find a matching book entry by:
      // 1. Exact amount match
      // 2. Date within 3 days
      // 3. Reference match (if available)
      for (const bookEntry of bookEntries) {
        const bookAmt =
          bankItem.type === 'DEPOSIT'
            ? Number(bookEntry.debit)
            : Number(bookEntry.credit)
        if (bookAmt === 0) continue

        // Amount match
        if (Math.abs(bookAmt - bankAmt) > 0.01) continue

        // Date proximity (within 3 days)
        const bankDate = new Date(bankItem.date).getTime()
        const bookDate = new Date(bookEntry.journalEntry.date).getTime()
        const daysDiff =
          Math.abs(bankDate - bookDate) / (1000 * 60 * 60 * 24)
        if (daysDiff > 3) continue

        // If we get here, it's a match
        await prisma.bankReconciliationItem.update({
          where: { id: bankItem.id },
          data: {
            isMatched: true,
            matchedJournalId: bookEntry.journalEntry.id,
            bookAmount: bookAmt,
          },
        })

        // Remove from available pool
        const idx = bookEntries.indexOf(bookEntry)
        if (idx > -1) bookEntries.splice(idx, 1)
        matchCount++
        break
      }
    }

    // Recalculate book balance using the same GL account filter
    const recalcWhere: Record<string, unknown> = {
      journalEntry: {
        status: 'APPROVED',
        deletedAt: null,
        date: {
          gte: reconciliation.periodStart,
          lte: reconciliation.periodEnd,
        },
      },
    }

    if (reconciliation.bankAccount.glAccountId) {
      recalcWhere.accountId = reconciliation.bankAccount.glAccountId
    } else {
      recalcWhere.account = { organizationId: auth.organizationId, isBankAccount: true }
    }

    const matchedJeLines = await prisma.journalEntryLine.aggregate({
      where: recalcWhere,
      _sum: { debit: true, credit: true },
    })

    const totalDebit = Number(matchedJeLines._sum.debit ?? 0)
    const totalCredit = Number(matchedJeLines._sum.credit ?? 0)
    const bookBalance = totalDebit - totalCredit
    const bankBalance = Number(reconciliation.bankBalance)
    const difference = bankBalance - bookBalance

    await prisma.bankReconciliation.update({
      where: { id },
      data: { bookBalance, difference },
    })

    const allItems = await prisma.bankReconciliationItem.findMany({
      where: { reconciliationId: id },
    })
    const unmatchedCount = allItems.filter((i) => !i.isMatched).length

    return apiSuccess({
      matched: matchCount,
      totalItems: allItems.length,
      unmatchedCount,
      bookBalance,
      difference,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
