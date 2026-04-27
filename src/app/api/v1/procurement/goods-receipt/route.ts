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

    const { poId, date, inspectionNotes, notes, lines } = body

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

    const poLineIds = new Set(po.lines.map((line) => line.id))
    for (const line of lines) {
      if (!line.poLineId || !poLineIds.has(line.poLineId)) {
        return apiBadRequest(`PO line ${line.poLineId || '(missing)'} does not belong to this purchase order`)
      }
    }

    const totalAccepted = lines.reduce(
      (sum: number, line: { quantityAccepted?: number }) => sum + Number(line.quantityAccepted || 0),
      0
    )
    const totalRejected = lines.reduce(
      (sum: number, line: { quantityRejected?: number }) => sum + Number(line.quantityRejected || 0),
      0
    )
    const receiptStatus =
      totalAccepted > 0 && totalRejected > 0
        ? 'PARTIAL'
        : totalAccepted > 0
          ? 'ACCEPTED'
          : 'REJECTED'

    const grnNo = await generateNextNumber(auth.organizationId, 'goods_receipt')

    const receipt = await prisma.goodsReceipt.create({
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
          create: lines.map(
            (l: {
              poLineId: string
              description: string
              quantityOrdered: number
              quantityReceived: number
              quantityAccepted: number
              quantityRejected?: number
              rejectionReason?: string
            }) => ({
              poLineId: l.poLineId,
              description: l.description,
              quantityOrdered: new Prisma.Decimal(l.quantityOrdered),
              quantityReceived: new Prisma.Decimal(l.quantityReceived),
              quantityAccepted: new Prisma.Decimal(l.quantityAccepted),
              quantityRejected: new Prisma.Decimal(l.quantityRejected || 0),
              rejectionReason: l.rejectionReason || null,
            })
          ),
        },
      },
      include: { lines: true },
    })

    // Update PO line receivedQty and PO status
    for (const line of lines) {
      await prisma.purchaseOrderLine.update({
        where: { id: line.poLineId },
        data: {
          receivedQty: {
            increment: Number(line.quantityAccepted || 0),
          },
        },
      })
    }

    // Refresh PO lines and determine PO status
    const updatedPoLines = await prisma.purchaseOrderLine.findMany({
      where: { poId },
    })

    const allFullyReceived = updatedPoLines.every(
      (l) => Number(l.receivedQty) >= Number(l.quantity)
    )
    const anyReceived = updatedPoLines.some(
      (l) => Number(l.receivedQty) > 0
    )

    let newPoStatus: string | undefined
    if (allFullyReceived) {
      newPoStatus = 'COMPLETED'
    } else if (anyReceived) {
      newPoStatus = 'PARTIALLY_RECEIVED'
    }

    if (newPoStatus) {
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: newPoStatus as 'PARTIALLY_RECEIVED' | 'COMPLETED' },
      })
    }

    // Cross-module: update inventory stock for lines that reference an inventory item
    for (const line of lines) {
      if (line.inventoryItemId && Number(line.quantityAccepted || 0) > 0) {
        await prisma.inventoryItem.update({
          where: { id: line.inventoryItemId },
          data: {
            stockInHand: {
              increment: Number(line.quantityAccepted),
            },
          },
        })
      }
    }

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
