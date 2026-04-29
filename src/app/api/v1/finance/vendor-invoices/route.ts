import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

const PROCUREMENT_GRN_SOURCE = 'PROCUREMENT_GRN'
const ACTIVE_INVOICE_STATUSES = ['MATCHED', 'APPROVED', 'PARTIALLY_PAID', 'PAID']

type InvoiceCreateInput = {
  invoiceNo?: string
  invoiceDate?: string
  vendorId?: string
  poId?: string
  grnIds?: string[]
  grossAmount?: number | string
  tdsAmount?: number | string
  vdsAmount?: number | string
  notes?: string
}

function decimalNumber(value: unknown) {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num : NaN
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const vendorId = url.searchParams.get('vendorId')
    if (vendorId) where.vendorId = vendorId

    const [invoices, total] = await Promise.all([
      prisma.vendorInvoice.findMany({
        where,
        include: {
          grns: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.vendorInvoice.count({ where }),
    ])

    return apiPaginated(invoices, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const body = (await request.json()) as InvoiceCreateInput

    const invoiceNo = typeof body.invoiceNo === 'string' ? body.invoiceNo.trim() : ''
    const vendorId = typeof body.vendorId === 'string' ? body.vendorId : ''
    const poId = typeof body.poId === 'string' ? body.poId : ''
    const grnIds = Array.isArray(body.grnIds) ? [...new Set(body.grnIds.filter(Boolean))] : []
    const grossAmount = decimalNumber(body.grossAmount)
    const tdsAmount = decimalNumber(body.tdsAmount)
    const vdsAmount = decimalNumber(body.vdsAmount)

    if (!invoiceNo || !vendorId || !poId || !body.invoiceDate || grnIds.length === 0) {
      return apiBadRequest('invoiceNo, invoiceDate, vendorId, poId, and grnIds are required')
    }
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      return apiBadRequest('grossAmount must be greater than zero')
    }
    if (tdsAmount < 0 || vdsAmount < 0 || tdsAmount + vdsAmount > grossAmount) {
      return apiBadRequest('tdsAmount and vdsAmount must be non-negative and cannot exceed grossAmount')
    }

    const [vendor, po] = await Promise.all([
      prisma.vendor.findFirst({
        where: { id: vendorId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true, companyName: true, isActive: true, isApproved: true },
      }),
      prisma.purchaseOrder.findFirst({
        where: { id: poId, vendorId, vendor: { organizationId: auth.organizationId }, deletedAt: null },
        select: { id: true, poNo: true, vendorId: true },
      }),
    ])

    if (!vendor) return apiBadRequest('Vendor not found in this organization')
    if (!vendor.isActive || !vendor.isApproved) return apiBadRequest('Vendor must be active and approved')
    if (!po) return apiBadRequest('Purchase order not found for this vendor')

    const duplicate = await prisma.vendorInvoice.findUnique({
      where: {
        organizationId_vendorId_invoiceNo: {
          organizationId: auth.organizationId,
          vendorId,
          invoiceNo,
        },
      },
      select: { id: true },
    })
    if (duplicate) return apiConflict('Duplicate invoice number for this vendor')

    const receipts = await prisma.goodsReceipt.findMany({
      where: {
        id: { in: grnIds },
        poId,
        vendorId,
        vendor: { organizationId: auth.organizationId },
        status: { in: ['ACCEPTED', 'PARTIAL'] },
      },
      include: {
        lines: {
          include: {
            poLine: { select: { unitPrice: true } },
          },
        },
      },
    })

    if (receipts.length !== grnIds.length) {
      return apiBadRequest('All GRNs must belong to the PO/vendor and be ACCEPTED or PARTIAL')
    }

    const postedCount = await prisma.journalEntry.count({
      where: {
        sourceModule: PROCUREMENT_GRN_SOURCE,
        sourceId: { in: grnIds },
        status: 'APPROVED',
        deletedAt: null,
      },
    })
    if (postedCount !== grnIds.length) {
      return apiBadRequest('All GRNs must be posted to accounting before vendor invoice matching')
    }

    const existingGrnLinks = await prisma.vendorInvoiceGrn.findMany({
      where: {
        grnId: { in: grnIds },
        invoice: {
          organizationId: auth.organizationId,
          status: { in: ACTIVE_INVOICE_STATUSES },
          deletedAt: null,
        },
      },
      select: { grnId: true },
    })
    if (existingGrnLinks.length > 0) {
      return apiConflict('One or more GRNs are already linked to an active vendor invoice')
    }

    const grnAmounts = receipts.map((receipt) => ({
      grnId: receipt.id,
      acceptedAmount: receipt.lines.reduce(
        (sum, line) => sum + Number(line.quantityAccepted) * Number(line.poLine.unitPrice),
        0
      ),
    }))
    const acceptedTotal = grnAmounts.reduce((sum, line) => sum + line.acceptedAmount, 0)

    if (grossAmount > acceptedTotal) {
      return apiBadRequest(
        `Invoice amount ${grossAmount.toFixed(2)} exceeds accepted GRN amount ${acceptedTotal.toFixed(2)}`
      )
    }

    const netPayable = grossAmount - tdsAmount - vdsAmount
    const invoice = await prisma.vendorInvoice.create({
      data: {
        organizationId: auth.organizationId,
        invoiceNo,
        invoiceDate: new Date(body.invoiceDate),
        vendorId,
        poId,
        grossAmount: new Prisma.Decimal(grossAmount),
        tdsAmount: new Prisma.Decimal(tdsAmount),
        vdsAmount: new Prisma.Decimal(vdsAmount),
        netPayable: new Prisma.Decimal(netPayable),
        outstandingAmount: new Prisma.Decimal(grossAmount),
        status: 'MATCHED',
        matchedAt: new Date(),
        notes: body.notes || null,
        createdById: auth.userId,
        grns: {
          create: grnAmounts.map((line) => ({
            grnId: line.grnId,
            acceptedAmount: new Prisma.Decimal(line.acceptedAmount),
          })),
        },
      },
      include: { grns: true, payments: true },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'FINANCE',
      resource: 'VendorInvoice',
      resourceId: invoice.id,
      description: `Matched vendor invoice ${invoiceNo} for ${vendor.companyName}`,
      newValues: { invoiceNo, vendorId, poId, grnIds, grossAmount, acceptedTotal },
      ...auditCtx,
    })

    return apiCreated(invoice)
  } catch (error) {
    return handleRouteError(error)
  }
}
