import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'
import { resolveProcurementLineClassifications } from '@/lib/procurement-line-classification'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const { id } = await params

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: {
            prLine: {
              select: {
                id: true,
                prId: true,
                requisition: {
                  select: { id: true, prNo: true, status: true },
                },
              },
            },
          },
        },
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
        },
        goodsReceipts: {
          select: {
            id: true,
            grnNo: true,
            date: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      return apiNotFound('Purchase order not found')
    }

    return apiSuccess(order)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const existing = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Purchase order not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiForbidden('Only DRAFT purchase orders can be updated')
    }

    const body = await request.json()
    const { date, deliveryDate, paymentTerms, status, notes, lines } = body

    const data: Record<string, unknown> = {}
    if (date !== undefined) data.date = new Date(date)
    if (deliveryDate !== undefined) data.deliveryDate = deliveryDate ? new Date(deliveryDate) : null
    if (paymentTerms !== undefined) data.paymentTerms = paymentTerms || null
    if (status !== undefined) data.status = status
    if (notes !== undefined) data.notes = notes || null

    if (lines && Array.isArray(lines) && lines.length > 0) {
      await prisma.purchaseOrderLine.deleteMany({ where: { poId: id } })

      const totalAmount = lines.reduce(
        (sum: number, l: { quantity?: number; unitPrice?: number }) =>
          sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)),
        0
      )
      data.totalAmount = new Prisma.Decimal(totalAmount)
      const lineClassifications = await resolveProcurementLineClassifications(auth.organizationId, lines)

      data.lines = {
        create: lines.map(
          (
            l: {
              description: string
              unit: string
              quantity: number
              unitPrice: number
              prLineId?: string
              itemType?: string
              inventoryItemId?: string
              warehouseId?: string
              assetCategoryId?: string
              accountId?: string
            },
            i: number
          ) => {
            const classification = lineClassifications[i]

            return {
              description: l.description,
              unit: l.unit,
              quantity: new Prisma.Decimal(l.quantity),
              unitPrice: new Prisma.Decimal(l.unitPrice),
              totalPrice: new Prisma.Decimal(Number(l.quantity) * Number(l.unitPrice)),
              prLineId: l.prLineId || null,
              itemType: classification.itemType,
              inventoryItemId: classification.inventoryItemId,
              warehouseId: classification.warehouseId,
              assetCategoryId: classification.assetCategoryId,
              accountId: classification.accountId || l.accountId || null,
              sortOrder: i,
            }
          }
        ),
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        vendor: { select: { id: true, companyName: true } },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
