import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
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
    const auth = await requireAuthFromRequest(request)
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

      data.lines = {
        create: lines.map(
          (
            l: { description: string; unit: string; quantity: number; unitPrice: number; prLineId?: string },
            i: number
          ) => ({
            description: l.description,
            unit: l.unit,
            quantity: new Prisma.Decimal(l.quantity),
            unitPrice: new Prisma.Decimal(l.unitPrice),
            totalPrice: new Prisma.Decimal(Number(l.quantity) * Number(l.unitPrice)),
            prLineId: l.prLineId || null,
            sortOrder: i,
          })
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
