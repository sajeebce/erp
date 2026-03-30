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

    const fund = await prisma.pettyCashFund.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        imprestAmount: true,
        currentBalance: true,
        currencyCode: true,
        custodianId: true,
        bankAccountId: true,
        projectId: true,
        location: true,
        isActive: true,
        lastReconciledAt: true,
        notes: true,
        bankAccount: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
            glAccountId: true,
            glAccount: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!fund) {
      return apiNotFound('Petty cash fund not found')
    }

    // Get recent 20 transactions
    const recentTransactions = await prisma.pettyCashTransaction.findMany({
      where: { fundId: id },
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
        notes: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
      take: 20,
    })

    return apiSuccess({
      ...fund,
      recentTransactions,
    })
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

    const existing = await prisma.pettyCashFund.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Petty cash fund not found')
    }

    const body = await request.json()

    // code cannot be changed after creation
    if (body.code !== undefined && body.code !== existing.code) {
      return apiBadRequest('code cannot be changed after creation')
    }

    const allowedFields = [
      'name', 'imprestAmount', 'custodianId', 'location', 'notes', 'isActive',
    ] as const

    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return apiBadRequest('name must be a non-empty string')
      }
      data.name = (data.name as string).trim()
    }

    // Validate imprestAmount if provided
    if (data.imprestAmount !== undefined) {
      if (typeof data.imprestAmount !== 'number' || data.imprestAmount <= 0) {
        return apiBadRequest('imprestAmount must be a positive number')
      }
    }

    const updated = await prisma.pettyCashFund.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        code: true,
        imprestAmount: true,
        currentBalance: true,
        currencyCode: true,
        custodianId: true,
        bankAccountId: true,
        projectId: true,
        location: true,
        isActive: true,
        lastReconciledAt: true,
        notes: true,
        bankAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
