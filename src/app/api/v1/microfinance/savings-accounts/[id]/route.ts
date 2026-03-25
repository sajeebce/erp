import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const account = await prisma.savingsAccount.findUnique({
      where: { id },
      select: {
        id: true,
        accountNo: true,
        memberId: true,
        type: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        interestEarned: true,
        interestRate: true,
        monthlyDeposit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            memberNo: true,
            beneficiary: { select: { id: true, name: true, phone: true } },
            samity: {
              select: {
                samityNo: true,
                name: true,
                branch: { select: { code: true, name: true, organizationId: true } },
              },
            },
          },
        },
      },
    })

    if (!account) {
      return apiNotFound('Savings account not found')
    }

    // Tenant isolation
    if (account.member.samity.branch.organizationId !== auth.organizationId) {
      return apiNotFound('Savings account not found')
    }

    // Get transaction history with pagination
    const [transactions, totalTransactions] = await Promise.all([
      prisma.savingsTransaction.findMany({
        where: { accountId: id },
        select: {
          id: true,
          date: true,
          type: true,
          amount: true,
          balanceAfter: true,
          reference: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savingsTransaction.count({ where: { accountId: id } }),
    ])

    return apiSuccess({
      ...account,
      transactions,
      transactionsMeta: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
