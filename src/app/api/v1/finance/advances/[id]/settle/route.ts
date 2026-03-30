import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json()
    const { settledAmount, refundAmount } = body

    if (settledAmount === undefined || settledAmount === null) {
      return apiBadRequest('settledAmount is required')
    }

    const numSettled = Number(settledAmount)
    if (isNaN(numSettled) || numSettled < 0) {
      return apiBadRequest('settledAmount must be 0 or greater')
    }

    const advance = await prisma.employeeAdvance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!advance) {
      return apiNotFound('Advance not found')
    }

    if (advance.status !== 'DISBURSED') {
      return apiBadRequest(
        'Only DISBURSED advances can be settled. Current status: ' + advance.status,
      )
    }

    const disbursed = Number(advance.disbursedAmount || 0)

    // Get current fiscal year
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: auth.organizationId, isCurrent: true },
    })
    if (!fiscalYear) {
      return apiBadRequest('No current fiscal year found. Please configure a fiscal year first.')
    }

    // Find advance receivable account
    const advanceAccountCode = advance.advanceType === 'TRAVEL' ? '1131' : '1132'
    const advanceAccount = await prisma.account.findFirst({
      where: { organizationId: auth.organizationId, code: advanceAccountCode },
    })
    if (!advanceAccount) {
      return apiBadRequest(
        `Advance Receivable account (${advanceAccountCode}) not found. Please set up Chart of Accounts.`,
      )
    }

    // Find default expense account
    const defaultExpenseAccount = await prisma.account.findFirst({
      where: {
        organizationId: auth.organizationId,
        type: 'EXPENSE',
        isActive: true,
        isGroup: false,
        deletedAt: null,
      },
      select: { id: true },
    })
    if (!defaultExpenseAccount) {
      return apiBadRequest('No expense account found. Please set up Chart of Accounts.')
    }

    // Find cash/bank account for refund or additional payment
    const cashAccount = await prisma.account.findFirst({
      where: { organizationId: auth.organizationId, code: '1101' },
    })
    const bankAccount = await prisma.account.findFirst({
      where: { organizationId: auth.organizationId, code: '1111' },
    })

    const now = new Date()
    const actualRefund = refundAmount !== undefined ? Number(refundAmount) : Math.max(0, disbursed - numSettled)
    const additionalPaid = numSettled > disbursed ? numSettled - disbursed : 0

    const result = await prisma.$transaction(async (tx) => {
      // Create settlement JE
      const entryNo = await generateNextNumber(auth.organizationId, 'journal_entry')

      const jeLines: Array<{
        accountId: string
        description: string
        debit: Prisma.Decimal
        credit: Prisma.Decimal
        projectId: string | null
      }> = []

      if (numSettled <= disbursed) {
        // Employee spent less than or equal to disbursed amount
        // DR Expense (settled amount), CR Advance Receivable (settled amount)
        if (numSettled > 0) {
          jeLines.push({
            accountId: defaultExpenseAccount.id,
            description: `Expense settlement for advance ${advance.advanceNo}`,
            debit: new Prisma.Decimal(numSettled),
            credit: new Prisma.Decimal(0),
            projectId: advance.projectId,
          })
        }

        // If there's a refund: DR Cash/Bank (refund), CR Advance Receivable (refund)
        if (actualRefund > 0) {
          const refundAccountId = cashAccount?.id || bankAccount?.id
          if (!refundAccountId) {
            throw new Error('No cash or bank account found for refund processing.')
          }
          jeLines.push({
            accountId: refundAccountId,
            description: `Refund from employee for advance ${advance.advanceNo}`,
            debit: new Prisma.Decimal(actualRefund),
            credit: new Prisma.Decimal(0),
            projectId: advance.projectId,
          })
        }

        // CR Advance Receivable for the full disbursed amount
        jeLines.push({
          accountId: advanceAccount.id,
          description: `Settlement of advance ${advance.advanceNo}`,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(disbursed),
          projectId: advance.projectId,
        })
      } else {
        // Employee spent more than disbursed — additional payment needed
        // DR Expense (full settled amount), CR Advance Receivable (disbursed), CR Cash/Bank (additional)
        jeLines.push({
          accountId: defaultExpenseAccount.id,
          description: `Expense settlement for advance ${advance.advanceNo}`,
          debit: new Prisma.Decimal(numSettled),
          credit: new Prisma.Decimal(0),
          projectId: advance.projectId,
        })

        jeLines.push({
          accountId: advanceAccount.id,
          description: `Settlement of advance ${advance.advanceNo}`,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(disbursed),
          projectId: advance.projectId,
        })

        const additionalAccountId = bankAccount?.id || cashAccount?.id
        if (!additionalAccountId) {
          throw new Error('No cash or bank account found for additional payment.')
        }
        jeLines.push({
          accountId: additionalAccountId,
          description: `Additional payment for advance ${advance.advanceNo}`,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(additionalPaid),
          projectId: advance.projectId,
        })
      }

      const totalDebit = jeLines.reduce((sum, l) => sum + Number(l.debit), 0)
      const totalCredit = jeLines.reduce((sum, l) => sum + Number(l.credit), 0)

      const je = await tx.journalEntry.create({
        data: {
          entryNo,
          date: now,
          description: `Settlement of advance ${advance.advanceNo}: ${advance.purpose}`,
          reference: advance.advanceNo,
          fiscalYearId: fiscalYear.id,
          projectId: advance.projectId,
          grantId: advance.grantId,
          totalDebit: new Prisma.Decimal(totalDebit),
          totalCredit: new Prisma.Decimal(totalCredit),
          status: 'APPROVED',
          isAutoGenerated: true,
          sourceModule: 'employee_advance',
          sourceId: advance.id,
          createdById: auth.userId,
          approvedById: auth.userId,
          approvedAt: now,
          postedAt: now,
          lines: {
            create: jeLines,
          },
        },
      })

      // Update advance
      const updated = await tx.employeeAdvance.update({
        where: { id },
        data: {
          status: 'SETTLED',
          settledAmount: new Prisma.Decimal(numSettled),
          refundAmount: actualRefund > 0 ? new Prisma.Decimal(actualRefund) : null,
          additionalPaid: additionalPaid > 0 ? new Prisma.Decimal(additionalPaid) : null,
          settledAt: now,
        },
      })

      return { ...updated, settlementJournalId: je.id }
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'employee_advance',
      resourceId: id,
      description: `Settled advance ${advance.advanceNo}. Disbursed: ${disbursed}, Settled: ${numSettled}, Refund: ${actualRefund}, Additional: ${additionalPaid}`,
      oldValues: { status: 'DISBURSED' },
      newValues: {
        status: 'SETTLED',
        settledAmount: numSettled,
        refundAmount: actualRefund,
        additionalPaid,
      },
      ...auditCtx,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
