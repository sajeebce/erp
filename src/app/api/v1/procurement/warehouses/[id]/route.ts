import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
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
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const { id } = await params

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        capacity: true,
        managerId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { inventoryItems: true },
        },
      },
    })

    if (!warehouse) {
      return apiNotFound('Warehouse not found')
    }

    return apiSuccess(warehouse)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const { id } = await params

    const existing = await prisma.warehouse.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Warehouse not found')
    }

    const body = await request.json()

    const allowedFields = ['name', 'location', 'capacity', 'managerId', 'phone', 'isActive'] as const

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

    const updated = await prisma.warehouse.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        capacity: true,
        managerId: true,
        phone: true,
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
