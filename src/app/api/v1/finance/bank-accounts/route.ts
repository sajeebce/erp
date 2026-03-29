import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountCode: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const type = url.searchParams.get('type')
    if (type) {
      where.type = type
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [bankAccounts, total] = await Promise.all([
      prisma.bankAccount.findMany({
        where,
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
          glAccountId: true,
          glAccount: {
            select: { id: true, code: true, name: true },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.bankAccount.count({ where }),
    ])

    return apiPaginated(bankAccounts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      accountCode,
      accountName,
      type,
      bankName,
      branchName,
      accountNumber,
      routingNumber,
      swiftCode,
      currencyCode,
      isMotherAccount,
      currentBalance,
      description,
      glAccountId,
    } = body

    if (!accountCode || !accountName || !type) {
      return apiBadRequest('accountCode, accountName, and type are required')
    }

    const validTypes = ['CURRENT', 'SAVINGS', 'FIXED_DEPOSIT', 'MOBILE_BANKING', 'CASH']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    if (currencyCode) {
      const validCurrencies = ['BDT', 'USD', 'EUR', 'GBP']
      if (!validCurrencies.includes(currencyCode)) {
        return apiBadRequest(`currencyCode must be one of: ${validCurrencies.join(', ')}`)
      }
    }

    // Validate glAccountId if provided
    if (glAccountId) {
      const glAccount = await prisma.account.findFirst({
        where: {
          id: glAccountId,
          organizationId: auth.organizationId,
        },
        select: { id: true, isGroup: true, isActive: true },
      })
      if (!glAccount) {
        return apiBadRequest('GL account not found in this organization')
      }
      if (glAccount.isGroup) {
        return apiBadRequest('GL account must not be a group account')
      }
      if (!glAccount.isActive) {
        return apiBadRequest('GL account must be active')
      }
    }

    // Check accountCode uniqueness within org
    const existing = await prisma.bankAccount.findUnique({
      where: {
        organizationId_accountCode: {
          organizationId: auth.organizationId,
          accountCode: accountCode.trim(),
        },
      },
    })

    if (existing) {
      return apiConflict(`A bank account with code "${accountCode}" already exists in this organization`)
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        organizationId: auth.organizationId,
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        type,
        bankName: bankName || null,
        branchName: branchName || null,
        accountNumber: accountNumber || null,
        routingNumber: routingNumber || null,
        swiftCode: swiftCode || null,
        currencyCode: currencyCode || 'BDT',
        isMotherAccount: isMotherAccount ?? false,
        currentBalance: currentBalance ?? 0,
        description: description || null,
        glAccountId: glAccountId || null,
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
        glAccountId: true,
        glAccount: {
          select: { id: true, code: true, name: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(bankAccount)
  } catch (error) {
    return handleRouteError(error)
  }
}
