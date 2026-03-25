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

    // PO tenant isolation: through vendor.organizationId
    const where: Record<string, unknown> = {
      vendor: { organizationId: auth.organizationId },
      deletedAt: null,
    }

    const vendorId = url.searchParams.get('vendorId')
    if (vendorId) {
      where.vendorId = vendorId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        select: {
          id: true,
          poNo: true,
          date: true,
          vendorId: true,
          vendor: {
            select: { companyName: true },
          },
          deliveryDate: true,
          totalAmount: true,
          paymentTerms: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return apiPaginated(orders, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { vendorId, date, deliveryDate, paymentTerms, notes, lines } = body

    if (!vendorId) {
      return apiBadRequest('vendorId is required')
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one line item is required')
    }

    // Validate vendor belongs to org
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: auth.organizationId, deletedAt: null },
    })

    if (!vendor) {
      return apiBadRequest('Vendor not found or does not belong to your organization')
    }

    const poNo = await generateNextNumber(auth.organizationId, 'purchase_order')

    const totalAmount = lines.reduce(
      (sum: number, l: { quantity?: number; unitPrice?: number }) =>
        sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)),
      0
    )

    const order = await prisma.purchaseOrder.create({
      data: {
        poNo,
        date: date ? new Date(date) : new Date(),
        vendorId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        totalAmount: new Prisma.Decimal(totalAmount),
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        lines: {
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
        },
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        vendor: { select: { companyName: true } },
      },
    })

    // Increment vendor totalOrders
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { totalOrders: { increment: 1 } },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'PurchaseOrder',
      resourceId: order.id,
      description: `Created purchase order ${poNo} for vendor ${vendor.companyName}`,
      ...audit,
    })

    return apiCreated(order)
  } catch (error) {
    return handleRouteError(error)
  }
}
