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

    const category = await prisma.expenseCategory.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
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

    if (!category) {
      return apiNotFound('Expense category not found')
    }

    return apiSuccess(category)
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

    const existing = await prisma.expenseCategory.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Expense category not found')
    }

    const body = await request.json()

    // code cannot be changed after creation
    if (body.code !== undefined && body.code !== existing.code) {
      return apiBadRequest('code cannot be changed after creation')
    }

    const allowedFields = [
      'name', 'glAccountId', 'budgetCategory', 'maxAmountPerItem',
      'requiresReceipt', 'tdsApplicable', 'defaultTdsRate',
      'vdsApplicable', 'defaultVdsRate', 'isActive', 'sortOrder',
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

    // Validate glAccountId if provided
    if (data.glAccountId !== undefined && data.glAccountId !== null) {
      const glAccount = await prisma.account.findFirst({
        where: {
          id: data.glAccountId as string,
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

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data,
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

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.expenseCategory.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Expense category not found')
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
