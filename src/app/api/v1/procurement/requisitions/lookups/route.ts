import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STAFF'])

    const [inventoryItems, warehouses, assetCategories] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: {
          isActive: true,
          warehouse: { organizationId: auth.organizationId },
        },
        select: {
          id: true,
          itemCode: true,
          name: true,
          unit: true,
          warehouseId: true,
          unitPrice: true,
        },
        orderBy: [{ itemCode: 'asc' }, { name: 'asc' }],
      }),
      prisma.warehouse.findMany({
        where: {
          organizationId: auth.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: [{ code: 'asc' }, { name: 'asc' }],
      }),
      prisma.assetCategory.findMany({
        where: {
          organizationId: auth.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: [{ code: 'asc' }, { name: 'asc' }],
      }),
    ])

    return apiSuccess({ inventoryItems, warehouses, assetCategories })
  } catch (error) {
    return handleRouteError(error)
  }
}
