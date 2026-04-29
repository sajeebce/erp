import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params

    const invoice = await prisma.vendorInvoice.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      include: {
        grns: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')

    const [vendor, po, grns] = await Promise.all([
      prisma.vendor.findFirst({
        where: { id: invoice.vendorId, organizationId: auth.organizationId },
        select: { id: true, vendorNo: true, companyName: true },
      }),
      prisma.purchaseOrder.findFirst({
        where: { id: invoice.poId, vendor: { organizationId: auth.organizationId } },
        select: { id: true, poNo: true, status: true },
      }),
      prisma.goodsReceipt.findMany({
        where: { id: { in: invoice.grns.map((link) => link.grnId) } },
        select: { id: true, grnNo: true, status: true, date: true },
        orderBy: { date: 'asc' },
      }),
    ])

    return apiSuccess({ ...invoice, vendor, purchaseOrder: po, goodsReceipts: grns })
  } catch (error) {
    return handleRouteError(error)
  }
}
