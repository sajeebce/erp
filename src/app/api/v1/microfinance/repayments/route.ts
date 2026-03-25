import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { Prisma } from '@prisma/client'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { loanAccountId, date, principalAmount, interestAmount, penaltyAmount, notes } = body

    if (!loanAccountId || principalAmount == null || interestAmount == null) {
      return apiBadRequest('loanAccountId, principalAmount, and interestAmount are required')
    }

    const loanAccount = await prisma.loanAccount.findUnique({
      where: { id: loanAccountId },
      include: {
        member: {
          include: {
            samity: { include: { branch: true } },
          },
        },
      },
    })

    if (!loanAccount) {
      return apiNotFound('Loan account not found')
    }

    // Tenant isolation
    const orgId = loanAccount.member.samity.branch.organizationId
    if (orgId !== auth.organizationId) {
      return apiNotFound('Loan account not found')
    }

    if (loanAccount.status !== 'ACTIVE') {
      return apiBadRequest(`Cannot record repayment for loan with status: ${loanAccount.status}`)
    }

    const totalAmount = Number(principalAmount) + Number(interestAmount) + Number(penaltyAmount || 0)
    const newTotalPaid = Number(loanAccount.totalPaid) + totalAmount
    const newOutstanding = Number(loanAccount.totalRepayable) - newTotalPaid
    const balanceAfter = Math.max(0, newOutstanding)

    // Check if loan is fully paid
    const isFullyPaid = balanceAfter <= 0.01 // Allow small rounding tolerance

    const repaymentNo = await generateNextNumber(auth.organizationId, 'mfi_repayment')
    const repaymentDate = date ? new Date(date) : new Date()

    const [repayment] = await prisma.$transaction([
      prisma.loanRepayment.create({
        data: {
          repaymentNo,
          loanAccountId,
          date: repaymentDate,
          principalAmount,
          interestAmount,
          totalAmount,
          penaltyAmount: penaltyAmount || 0,
          collectedById: auth.userId,
          balanceAfter,
          isOnTime: Number(loanAccount.daysOverdue) === 0,
          notes: notes || null,
        },
        select: {
          id: true,
          repaymentNo: true,
          loanAccountId: true,
          date: true,
          principalAmount: true,
          interestAmount: true,
          totalAmount: true,
          penaltyAmount: true,
          balanceAfter: true,
          isOnTime: true,
          createdAt: true,
        },
      }),
      prisma.loanAccount.update({
        where: { id: loanAccountId },
        data: {
          totalPaid: newTotalPaid,
          outstandingBalance: balanceAfter,
          lastPaymentDate: repaymentDate,
          ...(isFullyPaid && {
            status: 'CLOSED',
            overdueAmount: 0,
            daysOverdue: 0,
          }),
        },
      }),
    ])

    // Auto-create JE for repayment if accounts exist
    let journalEntryId: string | null = null

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: orgId, isCurrent: true },
      select: { id: true },
    })

    if (fiscalYear && totalAmount > 0) {
      // Find Bank/Cash (code '1101'), Loan Outstanding (code '1200'), Interest Income (code '4200')
      const bankAccount = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: '1101',
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true },
      })

      const loanOutstandingAccount = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: '1200',
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true },
      })

      const interestIncomeAccount = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: '4200',
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (bankAccount && loanOutstandingAccount) {
        const entryNo = await generateNextNumber(orgId, 'journal_entry')
        const now = new Date()

        const numPrincipal = Number(principalAmount)
        const numInterest = Number(interestAmount)

        const lines: {
          accountId: string
          description: string
          debit: Prisma.Decimal
          credit: Prisma.Decimal
        }[] = [
          {
            accountId: bankAccount.id,
            description: `Loan repayment received — ${loanAccount.accountNo}`,
            debit: new Prisma.Decimal(totalAmount),
            credit: new Prisma.Decimal(0),
          },
          {
            accountId: loanOutstandingAccount.id,
            description: `Principal repayment — ${loanAccount.accountNo}`,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(numPrincipal),
          },
        ]

        // Add interest income line if account exists and interest > 0
        if (interestIncomeAccount && numInterest > 0) {
          lines.push({
            accountId: interestIncomeAccount.id,
            description: `Interest income — ${loanAccount.accountNo}`,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(numInterest),
          })
        } else if (numInterest > 0) {
          // If no interest income account, add interest to loan outstanding CR
          lines[1] = {
            accountId: loanOutstandingAccount.id,
            description: `Principal + interest repayment — ${loanAccount.accountNo}`,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(numPrincipal + numInterest),
          }
        }

        const je = await prisma.journalEntry.create({
          data: {
            entryNo,
            date: repaymentDate,
            description: `Loan repayment ${repaymentNo} — ${loanAccount.accountNo}`,
            fiscalYearId: fiscalYear.id,
            totalDebit: new Prisma.Decimal(totalAmount),
            totalCredit: new Prisma.Decimal(totalAmount),
            status: 'APPROVED',
            isAutoGenerated: true,
            sourceModule: 'microfinance',
            sourceId: repayment.id,
            createdById: auth.userId,
            approvedById: auth.userId,
            approvedAt: now,
            postedAt: now,
            lines: {
              create: lines,
            },
          },
        })

        journalEntryId = je.id

        // Store journalEntryId on repayment record
        await prisma.loanRepayment.update({
          where: { id: repayment.id },
          data: { journalEntryId: je.id },
        })
      }
      // If accounts not found, skip JE — repayment still succeeds
    }

    return apiCreated({
      ...repayment,
      loanStatus: isFullyPaid ? 'CLOSED' : 'ACTIVE',
      journalEntryId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
