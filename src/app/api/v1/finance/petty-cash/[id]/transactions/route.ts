import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
  apiPaginated,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify fund belongs to org
    const fund = await prisma.pettyCashFund.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!fund) {
      return apiNotFound('Petty cash fund not found')
    }

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = { fundId: id }

    // Filter by action type
    const action = url.searchParams.get('action')
    if (action) {
      where.action = action
    }

    // Filter by date range
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const [transactions, total] = await Promise.all([
      prisma.pettyCashTransaction.findMany({
        where,
        select: {
          id: true,
          transactionNo: true,
          date: true,
          action: true,
          amount: true,
          balanceAfter: true,
          description: true,
          category: true,
          receiptPath: true,
          projectId: true,
          budgetLineId: true,
          accountId: true,
          journalEntryId: true,
          notes: true,
          recordedById: true,
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pettyCashTransaction.count({ where }),
    ])

    return apiPaginated(transactions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify fund belongs to org and is active
    const fund = await prisma.pettyCashFund.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        bankAccount: {
          select: { id: true, glAccountId: true },
        },
      },
    })

    if (!fund) {
      return apiNotFound('Petty cash fund not found')
    }

    if (!fund.isActive) {
      return apiBadRequest('This petty cash fund is inactive')
    }

    const body = await request.json()
    const {
      date,
      action,
      amount,
      description,
      category,
      accountId,
      projectId,
      budgetLineId,
      receiptPath,
      notes,
    } = body

    if (!date || !action || amount === undefined || !description) {
      return apiBadRequest('date, action, amount, and description are required')
    }

    const validActions = ['EXPENSE', 'REPLENISHMENT', 'ADJUSTMENT']
    if (!validActions.includes(action)) {
      return apiBadRequest(`action must be one of: ${validActions.join(', ')}`)
    }

    if (typeof amount !== 'number' || amount === 0) {
      return apiBadRequest('amount must be a non-zero number')
    }

    if (action === 'EXPENSE' && amount <= 0) {
      return apiBadRequest('amount must be positive for EXPENSE transactions')
    }

    if (action === 'REPLENISHMENT' && amount <= 0) {
      return apiBadRequest('amount must be positive for REPLENISHMENT transactions')
    }

    const currentBalance = Number(fund.currentBalance)
    const imprestAmount = Number(fund.imprestAmount)

    // For EXPENSE: check sufficient balance
    if (action === 'EXPENSE' && amount > currentBalance) {
      return apiBadRequest(`Insufficient fund balance. Current balance: ${currentBalance}, requested: ${amount}`)
    }

    // For REPLENISHMENT: cannot exceed imprest amount
    if (action === 'REPLENISHMENT') {
      const newBalance = currentBalance + amount
      if (newBalance > imprestAmount) {
        return apiBadRequest(`Replenishment would exceed imprest amount. Current balance: ${currentBalance}, imprest: ${imprestAmount}, max replenishment: ${imprestAmount - currentBalance}`)
      }
    }

    // Calculate new balance
    let balanceChange: number
    if (action === 'EXPENSE') {
      balanceChange = -amount
    } else if (action === 'REPLENISHMENT') {
      balanceChange = amount
    } else {
      // ADJUSTMENT: amount can be positive or negative
      balanceChange = amount
    }

    const newBalance = currentBalance + balanceChange

    // Get current fiscal year for journal entry
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: auth.organizationId, isCurrent: true },
    })

    const result = await prisma.$transaction(async (tx) => {
      // Generate transaction number
      const transactionNo = await generateNextNumber(auth.organizationId, 'petty_cash_txn')

      let journalEntryId: string | null = null

      // Auto-generate journal entry for EXPENSE and REPLENISHMENT
      if ((action === 'EXPENSE' || action === 'REPLENISHMENT') && fiscalYear) {
        const jeEntryNo = await generateNextNumber(auth.organizationId, 'journal_entry')
        const txAmount = new Prisma.Decimal(amount)

        // Determine GL accounts
        const fundGlAccountId = fund.bankAccount?.glAccountId || null

        if (action === 'EXPENSE') {
          // DR: expense account (provided accountId, or find default Office Supplies 5403)
          let debitAccountId = accountId || null
          if (!debitAccountId) {
            const officeSupplies = await tx.account.findFirst({
              where: {
                organizationId: auth.organizationId,
                code: '5403',
                isActive: true,
                deletedAt: null,
              },
              select: { id: true },
            })
            debitAccountId = officeSupplies?.id || null
          }

          // CR: petty cash GL account (1102)
          const creditAccountId = fundGlAccountId

          if (debitAccountId && creditAccountId) {
            const je = await tx.journalEntry.create({
              data: {
                entryNo: jeEntryNo,
                date: new Date(date),
                description: `Petty Cash Expense: ${description}`,
                reference: transactionNo,
                fiscalYearId: fiscalYear.id,
                projectId: projectId || fund.projectId || null,
                totalDebit: txAmount,
                totalCredit: txAmount,
                status: 'APPROVED',
                isAutoGenerated: true,
                sourceModule: 'petty_cash',
                sourceId: id,
                createdById: auth.userId,
                approvedById: auth.userId,
                approvedAt: new Date(),
                postedAt: new Date(),
                lines: {
                  create: [
                    {
                      accountId: debitAccountId,
                      description,
                      debit: txAmount,
                      credit: new Prisma.Decimal(0),
                      projectId: projectId || fund.projectId || null,
                    },
                    {
                      accountId: creditAccountId,
                      description,
                      debit: new Prisma.Decimal(0),
                      credit: txAmount,
                      projectId: projectId || fund.projectId || null,
                    },
                  ],
                },
              },
            })
            journalEntryId = je.id
          }
        } else if (action === 'REPLENISHMENT') {
          // DR: petty cash GL account (1102)
          const debitAccountId = fundGlAccountId

          // CR: main bank account (1111)
          const mainBank = await tx.account.findFirst({
            where: {
              organizationId: auth.organizationId,
              code: '1111',
              isActive: true,
              deletedAt: null,
            },
            select: { id: true },
          })
          const creditAccountId = mainBank?.id || null

          if (debitAccountId && creditAccountId) {
            const je = await tx.journalEntry.create({
              data: {
                entryNo: jeEntryNo,
                date: new Date(date),
                description: `Petty Cash Replenishment: ${description}`,
                reference: transactionNo,
                fiscalYearId: fiscalYear.id,
                projectId: projectId || fund.projectId || null,
                totalDebit: txAmount,
                totalCredit: txAmount,
                status: 'APPROVED',
                isAutoGenerated: true,
                sourceModule: 'petty_cash',
                sourceId: id,
                createdById: auth.userId,
                approvedById: auth.userId,
                approvedAt: new Date(),
                postedAt: new Date(),
                lines: {
                  create: [
                    {
                      accountId: debitAccountId,
                      description,
                      debit: txAmount,
                      credit: new Prisma.Decimal(0),
                      projectId: projectId || fund.projectId || null,
                    },
                    {
                      accountId: creditAccountId,
                      description,
                      debit: new Prisma.Decimal(0),
                      credit: txAmount,
                      projectId: projectId || fund.projectId || null,
                    },
                  ],
                },
              },
            })
            journalEntryId = je.id
          }
        }
      }

      // Create the transaction record
      const transaction = await tx.pettyCashTransaction.create({
        data: {
          fundId: id,
          transactionNo,
          date: new Date(date),
          action,
          amount: new Prisma.Decimal(Math.abs(amount)),
          balanceAfter: new Prisma.Decimal(newBalance),
          description: description.trim(),
          category: category || null,
          receiptPath: receiptPath || null,
          projectId: projectId || null,
          budgetLineId: budgetLineId || null,
          accountId: accountId || null,
          journalEntryId,
          recordedById: auth.userId,
          notes: notes || null,
        },
        select: {
          id: true,
          transactionNo: true,
          date: true,
          action: true,
          amount: true,
          balanceAfter: true,
          description: true,
          category: true,
          receiptPath: true,
          projectId: true,
          budgetLineId: true,
          accountId: true,
          journalEntryId: true,
          notes: true,
          recordedById: true,
          createdAt: true,
        },
      })

      // Update fund balance
      await tx.pettyCashFund.update({
        where: { id },
        data: { currentBalance: new Prisma.Decimal(newBalance) },
      })

      // Update bank account balance too
      if (fund.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: fund.bankAccountId },
          data: { currentBalance: new Prisma.Decimal(newBalance) },
        })
      }

      return transaction
    })

    return apiCreated(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
