import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

type GRNLineInput = {
  poLineId?: string
  description?: string
  quantityOrdered?: number | string
  quantityReceived?: number | string
  quantityAccepted?: number | string
  quantityRejected?: number | string
  rejectionReason?: string
}

function stockStatusFor(stock: number, reorderLevel: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stock <= 0) return 'OUT_OF_STOCK'
  if (stock <= reorderLevel) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // GRN tenant isolation: through PO -> vendor.organizationId
    const where: Record<string, unknown> = {
      vendor: { organizationId: auth.organizationId },
    }

    const poId = url.searchParams.get('poId')
    if (poId) {
      where.poId = poId
    }

    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where,
        select: {
          id: true,
          grnNo: true,
          date: true,
          poId: true,
          purchaseOrder: {
            select: { poNo: true },
          },
          vendorId: true,
          vendor: {
            select: { companyName: true },
          },
          receivedById: true,
          status: true,
          inspectionNotes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { lines: true },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.goodsReceipt.count({ where }),
    ])

    return apiPaginated(receipts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { poId, date, inspectionNotes, notes, lines } = body as {
      poId?: string
      date?: string
      inspectionNotes?: string
      notes?: string
      lines?: GRNLineInput[]
    }

    if (!poId) {
      return apiBadRequest('poId is required')
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one line item is required')
    }

    // Validate PO belongs to org through vendor
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: poId,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        vendor: true,
        lines: true,
      },
    })

    if (!po) {
      return apiBadRequest('Purchase order not found or does not belong to your organization')
    }

    if (!['ISSUED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      return apiBadRequest(`Goods receipt can only be created for ISSUED or PARTIALLY_RECEIVED purchase orders. Current status: ${po.status}`)
    }

    const poLineIds = new Set(po.lines.map((line) => line.id))
    const poLineById = new Map(po.lines.map((line) => [line.id, line]))
    for (const line of lines) {
      if (!line.poLineId || !poLineIds.has(line.poLineId)) {
        return apiBadRequest(`PO line ${line.poLineId || '(missing)'} does not belong to this purchase order`)
      }

      const poLine = poLineById.get(line.poLineId)
      const accepted = Number(line.quantityAccepted || 0)
      const rejected = Number(line.quantityRejected || 0)
      const received = Number(line.quantityReceived ?? accepted + rejected)
      const alreadyAccepted = Number(poLine?.receivedQty || 0)
      const ordered = Number(poLine?.quantity || 0)
      const remaining = Math.max(ordered - alreadyAccepted, 0)

      if ([accepted, rejected, received].some((value) => Number.isNaN(value) || value < 0)) {
        return apiBadRequest('Received, accepted, and rejected quantities must be non-negative numbers')
      }
      if (accepted + rejected > received) {
        return apiBadRequest(`Line ${poLine?.description || line.poLineId}: accepted plus rejected quantity cannot exceed received quantity`)
      }
      if (accepted > remaining) {
        return apiBadRequest(`Line ${poLine?.description || line.poLineId}: accepted quantity exceeds remaining PO quantity (${remaining})`)
      }
    }

    const totalAccepted = lines.reduce(
      (sum: number, line) => sum + Number(line.quantityAccepted || 0),
      0
    )
    const totalRejected = lines.reduce(
      (sum: number, line) => sum + Number(line.quantityRejected || 0),
      0
    )
    const receiptStatus =
      totalAccepted > 0 && totalRejected > 0
        ? 'PARTIAL'
        : totalAccepted > 0
          ? 'ACCEPTED'
          : 'REJECTED'

    const grnNo = await generateNextNumber(auth.organizationId, 'goods_receipt')

    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.goodsReceipt.create({
        data: {
          grnNo,
          date: date ? new Date(date) : new Date(),
          poId,
          vendorId: po.vendorId,
          receivedById: auth.userId,
          status: receiptStatus,
          inspectionNotes: inspectionNotes || null,
          notes: notes || null,
          lines: {
            create: lines.map((line) => {
              const poLine = poLineById.get(line.poLineId as string)
              const accepted = Number(line.quantityAccepted || 0)
              const rejected = Number(line.quantityRejected || 0)
              const received = Number(line.quantityReceived ?? accepted + rejected)

              return {
                poLineId: line.poLineId as string,
                description: line.description || poLine?.description || '',
                itemType: poLine?.itemType || 'SERVICE_OR_EXPENSE',
                inventoryItemId: poLine?.inventoryItemId || null,
                warehouseId: poLine?.warehouseId || null,
                assetCategoryId: poLine?.assetCategoryId || null,
                accountId: poLine?.accountId || null,
                quantityOrdered: new Prisma.Decimal(poLine?.quantity || 0),
                quantityReceived: new Prisma.Decimal(received),
                quantityAccepted: new Prisma.Decimal(accepted),
                quantityRejected: new Prisma.Decimal(rejected),
                rejectionReason: line.rejectionReason || null,
              }
            }),
          },
        },
        include: {
          lines: {
            include: {
              poLine: {
                select: { unitPrice: true },
              },
            },
          },
        },
      })

      for (const line of lines) {
        await tx.purchaseOrderLine.update({
          where: { id: line.poLineId as string },
          data: {
            receivedQty: {
              increment: Number(line.quantityAccepted || 0),
            },
          },
        })
      }

      const updatedPoLines = await tx.purchaseOrderLine.findMany({
        where: { poId },
      })

      const allFullyReceived = updatedPoLines.every(
        (line) => Number(line.receivedQty) >= Number(line.quantity)
      )
      const anyReceived = updatedPoLines.some(
        (line) => Number(line.receivedQty) > 0
      )

      if (allFullyReceived || anyReceived) {
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: { status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED' },
        })
      }

      for (const line of createdReceipt.lines) {
        const acceptedQty = Number(line.quantityAccepted)
        if (line.itemType !== 'INVENTORY' || !line.inventoryItemId || acceptedQty <= 0) {
          continue
        }

        const existingTransaction = await tx.inventoryTransaction.findUnique({
          where: {
            sourceModule_sourceLineId: {
              sourceModule: 'PROCUREMENT_GRN',
              sourceLineId: line.id,
            },
          },
        })
        if (existingTransaction) {
          continue
        }

        const item = await tx.inventoryItem.findFirst({
          where: {
            id: line.inventoryItemId,
            warehouse: { organizationId: auth.organizationId },
          },
        })
        if (!item) {
          throw new Error(`Inventory item not found for GRN line ${line.description}`)
        }
        if (line.warehouseId && line.warehouseId !== item.warehouseId) {
          throw new Error(`GRN line warehouse does not match inventory item warehouse for ${line.description}`)
        }

        const currentStock = Number(item.stockInHand)
        const currentTotalValue = Number(item.totalValue)
        const unitCost = Number(line.poLine?.unitPrice || 0)
        const totalCost = acceptedQty * unitCost
        const newStock = currentStock + acceptedQty
        const newTotalValue = currentTotalValue + totalCost
        const newUnitPrice = newStock > 0 ? newTotalValue / newStock : Number(item.unitPrice)
        const newStatus = stockStatusFor(newStock, Number(item.reorderLevel))

        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            stockInHand: new Prisma.Decimal(newStock),
            totalValue: new Prisma.Decimal(newTotalValue),
            unitPrice: new Prisma.Decimal(newUnitPrice),
            status: newStatus,
          },
        })

        await tx.inventoryTransaction.create({
          data: {
            itemId: item.id,
            type: 'IN',
            quantity: new Prisma.Decimal(acceptedQty),
            balanceAfter: new Prisma.Decimal(newStock),
            reference: grnNo,
            referenceId: createdReceipt.id,
            sourceModule: 'PROCUREMENT_GRN',
            sourceId: createdReceipt.id,
            sourceLineId: line.id,
            unitCost: new Prisma.Decimal(unitCost),
            totalCost: new Prisma.Decimal(totalCost),
            notes: `Accepted through goods receipt ${grnNo}`,
            transactedById: auth.userId,
          },
        })
      }

      return createdReceipt
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'GoodsReceipt',
      resourceId: receipt.id,
      description: `Created goods receipt ${grnNo} for PO ${po.poNo}`,
      ...audit,
    })

    return apiCreated(receipt)
  } catch (error) {
    return handleRouteError(error)
  }
}
