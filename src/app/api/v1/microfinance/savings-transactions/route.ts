import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
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
    const { accountId, type, amount, date, reference, notes } = body

    if (!accountId || !type || amount == null) {
      return apiBadRequest('accountId, type, and amount are required')
    }

    const validTypes = ['DEPOSIT', 'WITHDRAWAL']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    if (Number(amount) <= 0) {
      return apiBadRequest('Amount must be positive')
    }

    const account = await prisma.savingsAccount.findUnique({
      where: { id: accountId },
      include: {
        member: {
          include: {
            samity: { include: { branch: true } },
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

    if (!account.isActive) {
      return apiBadRequest('Savings account is inactive')
    }

    const txnAmount = Number(amount)
    const currentBalance = Number(account.balance)

    // Validate balance for withdrawal
    if (type === 'WITHDRAWAL' && txnAmount > currentBalance) {
      return apiBadRequest(`Insufficient balance. Available: ${currentBalance}`)
    }

    const balanceAfter = type === 'DEPOSIT'
      ? currentBalance + txnAmount
      : currentBalance - txnAmount

    const [transaction] = await prisma.$transaction([
      prisma.savingsTransaction.create({
        data: {
          accountId,
          date: date ? new Date(date) : new Date(),
          type,
          amount: txnAmount,
          balanceAfter,
          reference: reference || null,
          transactedById: auth.userId,
          notes: notes || null,
        },
        select: {
          id: true,
          accountId: true,
          date: true,
          type: true,
          amount: true,
          balanceAfter: true,
          reference: true,
          createdAt: true,
        },
      }),
      prisma.savingsAccount.update({
        where: { id: accountId },
        data: {
          balance: balanceAfter,
          ...(type === 'DEPOSIT'
            ? { totalDeposited: { increment: txnAmount } }
            : { totalWithdrawn: { increment: txnAmount } }),
        },
      }),
    ])

    return apiCreated(transaction)
  } catch (error) {
    return handleRouteError(error)
  }
}
