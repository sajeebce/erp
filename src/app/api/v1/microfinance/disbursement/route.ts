import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { Prisma } from '@prisma/client'
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

    // Tenant isolation via loan account -> member -> samity -> branch -> org
    const orgMembers = await prisma.mFIMember.findMany({
      where: { samity: { branch: { organizationId: auth.organizationId } } },
      select: { id: true },
    })
    const orgMemberIds = orgMembers.map((m) => m.id)

    const where: Record<string, unknown> = {
      loanAccount: { memberId: { in: orgMemberIds } },
    }

    const date = url.searchParams.get('date')
    if (date) {
      const d = new Date(date)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = { gte: d, lt: nextDay }
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [disbursements, total] = await Promise.all([
      prisma.loanDisbursement.findMany({
        where,
        select: {
          id: true,
          disbursementNo: true,
          loanAccountId: true,
          date: true,
          amount: true,
          mode: true,
          status: true,
          reference: true,
          notes: true,
          createdAt: true,
          loanAccount: {
            select: {
              accountNo: true,
              member: {
                select: {
                  memberNo: true,
                  beneficiary: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.loanDisbursement.count({ where }),
    ])

    return apiPaginated(disbursements, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { loanAccountId, date, mode, branchId, reference, notes } = body

    if (!loanAccountId || !mode) {
      return apiBadRequest('loanAccountId and mode are required')
    }

    // Validate loan account exists and belongs to org
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

    const orgId = loanAccount.member.samity.branch.organizationId
    if (orgId !== auth.organizationId) {
      return apiNotFound('Loan account not found')
    }

    if (loanAccount.status !== 'PENDING_DISBURSEMENT') {
      return apiBadRequest(`Cannot disburse loan with status: ${loanAccount.status}`)
    }

    const disbursementNo = await generateNextNumber(auth.organizationId, 'mfi_disbursement')
    const disbursementDate = date ? new Date(date) : new Date()
    const disbursedAmount = Number(loanAccount.principalAmount)

    const [disbursement] = await prisma.$transaction([
      prisma.loanDisbursement.create({
        data: {
          disbursementNo,
          loanAccountId,
          date: disbursementDate,
          amount: loanAccount.principalAmount,
          mode,
          branchId: branchId || null,
          disbursedById: auth.userId,
          status: 'DISBURSED',
          reference: reference || null,
          notes: notes || null,
        },
        select: {
          id: true,
          disbursementNo: true,
          loanAccountId: true,
          date: true,
          amount: true,
          mode: true,
          status: true,
          reference: true,
          createdAt: true,
        },
      }),
      prisma.loanAccount.update({
        where: { id: loanAccountId },
        data: {
          status: 'ACTIVE',
          disbursedAt: disbursementDate,
        },
      }),
    ])

    // Auto-create JE for disbursement if accounts exist
    let journalEntryId: string | null = null

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: orgId, isCurrent: true },
      select: { id: true },
    })

    if (fiscalYear && disbursedAmount > 0) {
      // Find Loan Portfolio account (code '1200') and Bank account (code '1101')
      const loanPortfolioAccount = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: '1200',
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true },
      })

      const bankAccount = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          code: '1101',
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (loanPortfolioAccount && bankAccount) {
        const entryNo = await generateNextNumber(orgId, 'journal_entry')
        const now = new Date()

        const je = await prisma.journalEntry.create({
          data: {
            entryNo,
            date: disbursementDate,
            description: `Loan disbursement ${disbursementNo} — ${loanAccount.accountNo}`,
            fiscalYearId: fiscalYear.id,
            totalDebit: new Prisma.Decimal(disbursedAmount),
            totalCredit: new Prisma.Decimal(disbursedAmount),
            status: 'APPROVED',
            isAutoGenerated: true,
            sourceModule: 'microfinance',
            sourceId: disbursement.id,
            createdById: auth.userId,
            approvedById: auth.userId,
            approvedAt: now,
            postedAt: now,
            lines: {
              create: [
                {
                  accountId: loanPortfolioAccount.id,
                  description: `Loan disbursement — ${loanAccount.accountNo}`,
                  debit: new Prisma.Decimal(disbursedAmount),
                  credit: new Prisma.Decimal(0),
                },
                {
                  accountId: bankAccount.id,
                  description: `Loan disbursement payment — ${loanAccount.accountNo}`,
                  debit: new Prisma.Decimal(0),
                  credit: new Prisma.Decimal(disbursedAmount),
                },
              ],
            },
          },
        })

        journalEntryId = je.id

        // Store journalEntryId on disbursement record
        await prisma.loanDisbursement.update({
          where: { id: disbursement.id },
          data: { journalEntryId: je.id },
        })
      }
      // If accounts not found, skip JE — disbursement still succeeds
    }

    return apiCreated({ ...disbursement, journalEntryId })
  } catch (error) {
    return handleRouteError(error)
  }
}
