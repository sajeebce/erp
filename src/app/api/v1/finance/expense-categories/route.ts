import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const isActive = url.searchParams.get('isActive')
    const search = url.searchParams.get('search') || undefined

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const categories = await prisma.expenseCategory.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        glAccountId: true,
        budgetCategory: true,
        maxAmountPerItem: true,
        requiresReceipt: true,
        tdsApplicable: true,
        defaultTdsRate: true,
        vdsApplicable: true,
        defaultVdsRate: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return apiSuccess(categories)
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
      glAccountId,
      budgetCategory,
      maxAmountPerItem,
      requiresReceipt,
      tdsApplicable,
      defaultTdsRate,
      vdsApplicable,
      defaultVdsRate,
      sortOrder,
    } = body

    if (!name || !code) {
      return apiBadRequest('name and code are required')
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

    // Check code uniqueness within org
    const existing = await prisma.expenseCategory.findUnique({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: code.trim(),
        },
      },
    })

    if (existing) {
      return apiConflict(`An expense category with code "${code}" already exists in this organization`)
    }

    const category = await prisma.expenseCategory.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        code: code.trim(),
        glAccountId: glAccountId || null,
        budgetCategory: budgetCategory || null,
        maxAmountPerItem: maxAmountPerItem ?? null,
        requiresReceipt: requiresReceipt ?? true,
        tdsApplicable: tdsApplicable ?? false,
        defaultTdsRate: defaultTdsRate ?? null,
        vdsApplicable: vdsApplicable ?? false,
        defaultVdsRate: defaultVdsRate ?? null,
        sortOrder: sortOrder ?? 0,
      },
      select: {
        id: true,
        name: true,
        code: true,
        glAccountId: true,
        budgetCategory: true,
        maxAmountPerItem: true,
        requiresReceipt: true,
        tdsApplicable: true,
        defaultTdsRate: true,
        vdsApplicable: true,
        defaultVdsRate: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
      },
    })

    return apiCreated(category)
  } catch (error) {
    return handleRouteError(error)
  }
}
