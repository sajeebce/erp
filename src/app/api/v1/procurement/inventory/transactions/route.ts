import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const body = await request.json()

    const { itemId, type, quantity, reference, referenceId, notes } = body

    if (!itemId || !type || quantity === undefined) {
      return apiBadRequest('itemId, type, and quantity are required')
    }

    const validTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return apiBadRequest('quantity must be a positive number')
    }

    // Validate item belongs to org warehouse
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        warehouse: { organizationId: auth.organizationId },
      },
    })

    if (!item) {
      return apiNotFound('Inventory item not found')
    }

    const currentStock = Number(item.stockInHand)
    let newStock: number

    if (type === 'IN') {
      newStock = currentStock + qty
    } else if (type === 'OUT') {
      if (qty > currentStock) {
        return apiBadRequest(`Insufficient stock. Available: ${currentStock}, requested: ${qty}`)
      }
      newStock = currentStock - qty
    } else if (type === 'TRANSFER') {
      if (qty > currentStock) {
        return apiBadRequest(`Insufficient stock for transfer. Available: ${currentStock}, requested: ${qty}`)
      }
      newStock = currentStock - qty
    } else {
      // ADJUSTMENT: can set to any value
      newStock = qty
    }

    const unitPrice = Number(item.unitPrice)
    const newTotalValue = newStock * unitPrice

    // Determine new status based on reorderLevel
    const reorderLevel = Number(item.reorderLevel)
    let newStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK'
    if (newStock <= 0) {
      newStatus = 'OUT_OF_STOCK'
    } else if (newStock <= reorderLevel) {
      newStatus = 'LOW_STOCK'
    }

    const [transaction] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          itemId,
          type,
          quantity: new Prisma.Decimal(type === 'ADJUSTMENT' ? Math.abs(qty - currentStock) : qty),
          balanceAfter: new Prisma.Decimal(newStock),
          reference: reference || null,
          referenceId: referenceId || null,
          notes: notes || null,
          transactedById: auth.userId,
        },
        select: {
          id: true,
          itemId: true,
          type: true,
          quantity: true,
          balanceAfter: true,
          reference: true,
          referenceId: true,
          notes: true,
          transactedById: true,
          createdAt: true,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          stockInHand: new Prisma.Decimal(newStock),
          totalValue: new Prisma.Decimal(newTotalValue),
          status: newStatus,
        },
      }),
    ])

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'PROCUREMENT',
      resource: 'InventoryTransaction',
      resourceId: transaction.id,
      description: `Recorded ${type} transaction for item ${item.itemCode}: qty ${qty}, balance ${newStock}`,
      oldValues: { stockInHand: currentStock },
      newValues: { stockInHand: newStock, status: newStatus },
      ...audit,
    })

    return apiCreated(transaction)
  } catch (error) {
    return handleRouteError(error)
  }
}
