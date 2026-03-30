import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
  apiPaginated,
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
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [funds, total] = await Promise.all([
      prisma.pettyCashFund.findMany({
        where,
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
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.pettyCashFund.count({ where }),
    ])

    return apiPaginated(funds, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      code,
      imprestAmount,
      custodianId,
      projectId,
      location,
      notes,
      currencyCode,
    } = body

    if (!name || !code || imprestAmount === undefined || !custodianId) {
      return apiBadRequest('name, code, imprestAmount, and custodianId are required')
    }

    if (typeof imprestAmount !== 'number' || imprestAmount <= 0) {
      return apiBadRequest('imprestAmount must be a positive number')
    }

    // Check code uniqueness within org
    const existing = await prisma.pettyCashFund.findUnique({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: code.trim(),
        },
      },
    })

    if (existing) {
      return apiConflict(`A petty cash fund with code "${code}" already exists in this organization`)
    }

    // Find the GL account for petty cash (code 1102)
    const pettyCashGlAccount = await prisma.account.findFirst({
      where: {
        organizationId: auth.organizationId,
        code: '1102',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    })

    const fund = await prisma.$transaction(async (tx) => {
      // Auto-create a BankAccount record for this petty cash fund
      const bankAccount = await tx.bankAccount.create({
        data: {
          organizationId: auth.organizationId,
          accountCode: `PC-${code.trim()}`,
          accountName: name.trim(),
          type: 'CASH',
          currencyCode: currencyCode || 'BDT',
          currentBalance: imprestAmount,
          glAccountId: pettyCashGlAccount?.id || null,
        },
      })

      // Create the petty cash fund
      const newFund = await tx.pettyCashFund.create({
        data: {
          organizationId: auth.organizationId,
          name: name.trim(),
          code: code.trim(),
          imprestAmount,
          currentBalance: imprestAmount,
          currencyCode: currencyCode || 'BDT',
          custodianId,
          bankAccountId: bankAccount.id,
          projectId: projectId || null,
          location: location || null,
          notes: notes || null,
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
          notes: true,
          bankAccount: {
            select: { id: true, accountCode: true, accountName: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      })

      return newFund
    })

    return apiCreated(fund)
  } catch (error) {
    return handleRouteError(error)
  }
}
