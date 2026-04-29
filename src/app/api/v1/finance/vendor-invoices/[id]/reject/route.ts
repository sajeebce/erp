import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiSuccess, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params
    const body = await request.json()
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!reason) return apiBadRequest('reason is required')

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, invoiceNo: true, status: true, paidAmount: true },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')
    if (Number(invoice.paidAmount) > 0) return apiBadRequest('Paid invoices cannot be rejected')
    if (invoice.status === 'REJECTED' || invoice.status === 'CANCELLED') {
      return apiBadRequest(`Invoice is already ${invoice.status}`)
    }

    const now = new Date()
    const updated = await prisma.vendorInvoice.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: auth.userId,
        rejectedAt: now,
        rejectionReason: reason,
      },
      include: { grns: true, payments: true },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'REJECT',
      module: 'FINANCE',
      resource: 'VendorInvoice',
      resourceId: id,
      description: `Rejected vendor invoice ${invoice.invoiceNo}: ${reason}`,
      oldValues: { status: invoice.status },
      newValues: { status: 'REJECTED', rejectionReason: reason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
