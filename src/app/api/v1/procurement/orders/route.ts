import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
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

interface PurchaseOrderLineInput {
  description: string
  unit: string
  quantity: number
  unitPrice: number
  prLineId?: string
}

async function requisitionBelongsToOrg(
  requisition: { project: { organizationId: string } | null; requestedById: string },
  organizationId: string
) {
  if (requisition.project?.organizationId === organizationId) {
    return true
  }

  const requester = await prisma.user.findFirst({
    where: {
      id: requisition.requestedById,
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  })

  return Boolean(requester)
}

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

    const prId = url.searchParams.get('prId')
    if (prId) {
      where.lines = {
        some: {
          prLine: { prId },
        },
      }
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
          lines: {
            select: {
              prLine: {
                select: {
                  requisition: {
                    select: { id: true, prNo: true },
                  },
                },
              },
            },
            take: 1,
          },
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
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const body = await request.json()

    const { vendorId, prId, date, deliveryDate, paymentTerms, notes } = body
    let { lines } = body as { lines?: PurchaseOrderLineInput[] }

    if (!vendorId) {
      return apiBadRequest('vendorId is required')
    }

    // Validate vendor belongs to org
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, organizationId: auth.organizationId, deletedAt: null },
    })

    if (!vendor) {
      return apiBadRequest('Vendor not found or does not belong to your organization')
    }

    let sourcePr: {
      id: string
      prNo: string
      status: string
      requestedById: string
      project: { organizationId: string } | null
      lines: Array<{
        id: string
        description: string
        unit: string
        quantity: Prisma.Decimal
        estimatedPrice: Prisma.Decimal
      }>
    } | null = null

    if (prId) {
      sourcePr = await prisma.purchaseRequisition.findFirst({
        where: { id: prId, deletedAt: null },
        include: {
          project: { select: { organizationId: true } },
          lines: { orderBy: { sortOrder: 'asc' } },
        },
      })

      if (!sourcePr) {
        return apiBadRequest('Purchase requisition not found')
      }

      const belongsToOrg = await requisitionBelongsToOrg(sourcePr, auth.organizationId)
      if (!belongsToOrg) {
        return apiBadRequest('Purchase requisition not found in your organization')
      }

      if (sourcePr.status !== 'APPROVED') {
        return apiBadRequest(`Only APPROVED requisitions can create purchase orders. Current status: ${sourcePr.status}`)
      }

      const existingPo = await prisma.purchaseOrder.findFirst({
        where: {
          deletedAt: null,
          lines: { some: { prLine: { prId } } },
        },
        select: { poNo: true },
      })

      if (existingPo) {
        return apiBadRequest(`Purchase order ${existingPo.poNo} already exists for this requisition`)
      }

      if (!lines || lines.length === 0) {
        lines = sourcePr.lines.map((line) => ({
          description: line.description,
          unit: line.unit,
          quantity: Number(line.quantity),
          unitPrice: Number(line.estimatedPrice),
          prLineId: line.id,
        }))
      }

      const prLineIds = new Set(sourcePr.lines.map((line) => line.id))
      const hasInvalidLine = lines.some((line) => !line.prLineId || !prLineIds.has(line.prLineId))
      if (hasInvalidLine) {
        return apiBadRequest('All PO lines for a requisition must reference lines from that requisition')
      }
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one line item is required')
    }

    const poNo = await generateNextNumber(auth.organizationId, 'purchase_order')

    const totalAmount = lines.reduce(
      (sum: number, l: { quantity?: number; unitPrice?: number }) =>
        sum + (Number(l.quantity || 0) * Number(l.unitPrice || 0)),
      0
    )

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          poNo,
          date: date ? new Date(date) : new Date(),
          vendorId,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentTerms: paymentTerms || null,
          status: sourcePr ? 'ISSUED' : 'DRAFT',
          notes: notes || null,
          lines: {
            create: lines.map((l, i: number) => ({
              description: l.description,
              unit: l.unit,
              quantity: new Prisma.Decimal(l.quantity),
              unitPrice: new Prisma.Decimal(l.unitPrice),
              totalPrice: new Prisma.Decimal(Number(l.quantity) * Number(l.unitPrice)),
              prLineId: l.prLineId || null,
              sortOrder: i,
            })),
          },
        },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          vendor: { select: { companyName: true } },
        },
      })

      if (sourcePr) {
        await tx.purchaseRequisition.update({
          where: { id: sourcePr.id },
          data: {
            status: 'PO_CREATED',
            linkedPOId: created.id,
          },
        })
      }

      await tx.vendor.update({
        where: { id: vendorId },
        data: { totalOrders: { increment: 1 } },
      })

      return created
    })


    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'PurchaseOrder',
      resourceId: order.id,
      description: sourcePr
        ? `Created purchase order ${poNo} from requisition ${sourcePr.prNo} for vendor ${vendor.companyName}`
        : `Created purchase order ${poNo} for vendor ${vendor.companyName}`,
      newValues: { poNo, prId: sourcePr?.id, status: order.status, totalAmount },
      ...audit,
    })

    if (sourcePr) {
      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: 'UPDATE',
        module: 'PROCUREMENT',
        resource: 'PurchaseRequisition',
        resourceId: sourcePr.id,
        description: `Marked requisition ${sourcePr.prNo} as PO_CREATED via ${poNo}`,
        oldValues: { status: 'APPROVED' },
        newValues: { status: 'PO_CREATED', linkedPOId: order.id },
        ...audit,
      })
    }

    return apiCreated(order)
  } catch (error) {
    return handleRouteError(error)
  }
}
