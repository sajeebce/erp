import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        warehouse: { organizationId: auth.organizationId },
      },
      select: {
        id: true,
        itemCode: true,
        name: true,
        category: true,
        unit: true,
        warehouseId: true,
        warehouse: {
          select: { code: true, name: true, location: true },
        },
        stockInHand: true,
        reorderLevel: true,
        unitPrice: true,
        totalValue: true,
        status: true,
        donorFunded: true,
        donorId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            quantity: true,
            balanceAfter: true,
            reference: true,
            notes: true,
            transactedById: true,
            createdAt: true,
          },
        },
      },
    })

    if (!item) {
      return apiNotFound('Inventory item not found')
    }

    return apiSuccess(item)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        warehouse: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      return apiNotFound('Inventory item not found')
    }

    const body = await request.json()

    const allowedFields = [
      'name', 'category', 'unit', 'reorderLevel',
      'unitPrice', 'donorFunded', 'donorId', 'isActive',
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

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return apiBadRequest('name must be a non-empty string')
      }
      data.name = (data.name as string).trim()
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data,
      select: {
        id: true,
        itemCode: true,
        name: true,
        category: true,
        unit: true,
        warehouseId: true,
        stockInHand: true,
        reorderLevel: true,
        unitPrice: true,
        totalValue: true,
        status: true,
        donorFunded: true,
        donorId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
