import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated, apiPaginated, apiBadRequest,
  handleRouteError, parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const fund = await prisma.gratuityFund.findFirst({
      where: { organizationId: auth.organizationId, isActive: true },
      select: { id: true },
    })

    if (!fund) {
      return apiPaginated([], 0, page, limit)
    }

    const where = { fundId: fund.id }

    const [transactions, total] = await Promise.all([
      prisma.gratuityFundTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gratuityFundTransaction.count({ where }),
    ])

    return apiPaginated(transactions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { type, amount, description, referenceNo, transactionDate } = body

    if (!type || !amount || !transactionDate) {
      return apiBadRequest('type, amount, and transactionDate are required')
    }

    // Get or create fund
    let fund = await prisma.gratuityFund.findFirst({
      where: { organizationId: auth.organizationId, isActive: true },
    })

    if (!fund) {
      fund = await prisma.gratuityFund.create({
        data: {
          organizationId: auth.organizationId,
          name: 'Main Gratuity Fund',
        },
      })
    }

    const isCredit = ['DEPOSIT', 'INTEREST', 'FDR_MATURITY'].includes(type)
    const newBalance = isCredit
      ? fund.currentBalance.add(amount)
      : fund.currentBalance.sub(amount)

    const transactionNo = await generateNextNumber(auth.organizationId, 'gratuity_fund_txn')

    const [transaction] = await prisma.$transaction([
      prisma.gratuityFundTransaction.create({
        data: {
          fundId: fund.id,
          transactionNo,
          type,
          amount,
          balance: newBalance,
          description: description || null,
          referenceNo: referenceNo || null,
          transactionDate: new Date(transactionDate),
        },
      }),
      prisma.gratuityFund.update({
        where: { id: fund.id },
        data: { currentBalance: newBalance },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'gratuity_fund_transaction',
      resourceId: transaction.id,
      description: `Recorded gratuity fund ${type} of ${amount}`,
      newValues: { transactionNo, type, amount },
      ...auditCtx,
    })

    return apiCreated(transaction)
  } catch (error) {
    return handleRouteError(error)
  }
}
