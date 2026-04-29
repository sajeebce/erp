import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    // Inventory tenant isolation: through warehouse.organizationId
    const where: Record<string, unknown> = {
      warehouse: { organizationId: auth.organizationId },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const warehouseId = url.searchParams.get('warehouseId')
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const category = url.searchParams.get('category')
    if (category) {
      where.category = category
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        select: {
          id: true,
          itemCode: true,
          name: true,
          category: true,
          unit: true,
          warehouseId: true,
          warehouse: {
            select: { code: true, name: true },
          },
          stockInHand: true,
          reorderLevel: true,
          unitPrice: true,
          totalValue: true,
          status: true,
          donorFunded: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ])

    return apiPaginated(items, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const body = await request.json()

    const {
      itemCode, name, category, unit, warehouseId,
      stockInHand, reorderLevel, unitPrice,
      donorFunded, donorId,
    } = body

    if (!itemCode || !name || !unit || !warehouseId) {
      return apiBadRequest('itemCode, name, unit, and warehouseId are required')
    }

    // Validate warehouse belongs to org
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId: auth.organizationId },
    })
    if (!warehouse) {
      return apiBadRequest('Warehouse not found or does not belong to your organization')
    }

    // Check unique itemCode
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { itemCode },
    })
    if (existingItem) {
      return apiBadRequest(`Item code "${itemCode}" already exists`)
    }

    const stock = Number(stockInHand || 0)
    const price = Number(unitPrice || 0)
    const reorder = Number(reorderLevel || 0)

    // Determine initial status
    let initialStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK'
    if (stock <= 0) {
      initialStatus = 'OUT_OF_STOCK'
    } else if (stock <= reorder) {
      initialStatus = 'LOW_STOCK'
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode: itemCode.trim(),
        name: name.trim(),
        category: category || null,
        unit,
        warehouseId,
        stockInHand: new Prisma.Decimal(stock),
        reorderLevel: new Prisma.Decimal(reorder),
        unitPrice: new Prisma.Decimal(price),
        totalValue: new Prisma.Decimal(stock * price),
        status: initialStatus,
        donorFunded: donorFunded || false,
        donorId: donorId || null,
      },
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

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'InventoryItem',
      resourceId: item.id,
      description: `Created inventory item ${itemCode}`,
      ...audit,
    })

    return apiCreated(item)
  } catch (error) {
    return handleRouteError(error)
  }
}
