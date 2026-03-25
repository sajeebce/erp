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

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      select: {
        id: true,
        accountCode: true,
        accountName: true,
        type: true,
        bankName: true,
        branchName: true,
        accountNumber: true,
        routingNumber: true,
        swiftCode: true,
        currencyCode: true,
        isMotherAccount: true,
        currentBalance: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!bankAccount) {
      return apiNotFound('Bank account not found')
    }

    // Get last 10 vouchers linked to this bank account
    const recentVouchers = await prisma.voucher.findMany({
      where: {
        bankAccountId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        voucherNo: true,
        type: true,
        date: true,
        description: true,
        amount: true,
        payee: true,
        chequeNo: true,
        chequeDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
    })

    return apiSuccess({
      ...bankAccount,
      recentTransactions: recentVouchers,
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

    const existing = await prisma.bankAccount.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Bank account not found')
    }

    const body = await request.json()

    // accountCode cannot be changed after creation
    if (body.accountCode !== undefined && body.accountCode !== existing.accountCode) {
      return apiBadRequest('accountCode cannot be changed after creation')
    }

    const allowedFields = [
      'accountName', 'type', 'bankName', 'branchName',
      'accountNumber', 'routingNumber', 'swiftCode', 'currencyCode',
      'isMotherAccount', 'currentBalance', 'isActive', 'description',
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

    // Validate accountName if provided
    if (data.accountName !== undefined) {
      if (typeof data.accountName !== 'string' || data.accountName.trim().length === 0) {
        return apiBadRequest('accountName must be a non-empty string')
      }
      data.accountName = (data.accountName as string).trim()
    }

    // Validate type if provided
    if (data.type !== undefined) {
      const validTypes = ['CURRENT', 'SAVINGS', 'FIXED_DEPOSIT', 'MOBILE_BANKING', 'CASH']
      if (!validTypes.includes(data.type as string)) {
        return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
      }
    }

    // Validate currencyCode if provided
    if (data.currencyCode !== undefined) {
      const validCurrencies = ['BDT', 'USD', 'EUR', 'GBP']
      if (!validCurrencies.includes(data.currencyCode as string)) {
        return apiBadRequest(`currencyCode must be one of: ${validCurrencies.join(', ')}`)
      }
    }

    const updated = await prisma.bankAccount.update({
      where: { id },
      data,
      select: {
        id: true,
        accountCode: true,
        accountName: true,
        type: true,
        bankName: true,
        branchName: true,
        accountNumber: true,
        routingNumber: true,
        swiftCode: true,
        currencyCode: true,
        isMotherAccount: true,
        currentBalance: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
