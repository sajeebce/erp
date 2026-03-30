import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const fund = await prisma.pettyCashFund.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!fund) {
      return apiNotFound('Petty cash fund not found')
    }

    const body = await request.json()
    const { physicalCount } = body

    if (physicalCount === undefined || typeof physicalCount !== 'number') {
      return apiBadRequest('physicalCount is required and must be a number')
    }

    if (physicalCount < 0) {
      return apiBadRequest('physicalCount cannot be negative')
    }

    const currentBalance = Number(fund.currentBalance)
    const difference = physicalCount - currentBalance

    const now = new Date()

    // If there's a difference, create an ADJUSTMENT transaction
    if (difference !== 0) {
      const result = await prisma.$transaction(async (tx) => {
        const transactionNo = await generateNextNumber(auth.organizationId, 'petty_cash')

        const newBalance = physicalCount

        const transaction = await tx.pettyCashTransaction.create({
          data: {
            fundId: id,
            transactionNo,
            date: now,
            action: 'ADJUSTMENT',
            amount: new Prisma.Decimal(Math.abs(difference)),
            balanceAfter: new Prisma.Decimal(newBalance),
            description: `Reconciliation adjustment: physical count ${physicalCount}, system balance ${currentBalance}, difference ${difference > 0 ? '+' : ''}${difference}`,
            recordedById: auth.userId,
            notes: `Auto-generated from reconciliation on ${now.toISOString().split('T')[0]}`,
          },
          select: {
            id: true,
            transactionNo: true,
            date: true,
            action: true,
            amount: true,
            balanceAfter: true,
            description: true,
            notes: true,
            createdAt: true,
          },
        })

        // Update fund balance and reconciliation timestamp
        const updatedFund = await tx.pettyCashFund.update({
          where: { id },
          data: {
            currentBalance: new Prisma.Decimal(newBalance),
            lastReconciledAt: now,
          },
          select: {
            id: true,
            name: true,
            code: true,
            currentBalance: true,
            lastReconciledAt: true,
          },
        })

        // Sync bank account balance
        if (fund.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: fund.bankAccountId },
            data: { currentBalance: new Prisma.Decimal(newBalance) },
          })
        }

        return {
          fund: updatedFund,
          adjustmentTransaction: transaction,
          reconciliation: {
            physicalCount,
            systemBalance: currentBalance,
            difference,
            adjustmentCreated: true,
          },
        }
      })

      return apiSuccess(result)
    }

    // No difference — just update lastReconciledAt
    const updatedFund = await prisma.pettyCashFund.update({
      where: { id },
      data: { lastReconciledAt: now },
      select: {
        id: true,
        name: true,
        code: true,
        currentBalance: true,
        lastReconciledAt: true,
      },
    })

    return apiSuccess({
      fund: updatedFund,
      adjustmentTransaction: null,
      reconciliation: {
        physicalCount,
        systemBalance: currentBalance,
        difference: 0,
        adjustmentCreated: false,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
