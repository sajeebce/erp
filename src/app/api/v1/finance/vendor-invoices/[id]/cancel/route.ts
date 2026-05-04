import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

const CANCELLABLE_STATUSES = ['DRAFT', 'MATCHED', 'SUBMITTED', 'APPROVED']

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        paidAmount: true,
      },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')
    if (Number(invoice.paidAmount) > 0) {
      return apiBadRequest('Cannot cancel an invoice with recorded payments. Reverse payments first.')
    }
    if (!CANCELLABLE_STATUSES.includes(invoice.status)) {
      return apiBadRequest(`Invoice status ${invoice.status} cannot be cancelled`)
    }

    const updated = await prisma.vendorInvoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `[CANCELLED] ${reason}` : undefined,
      },
      include: { grns: true, payments: true },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'FINANCE',
      resource: 'VendorInvoice',
      resourceId: id,
      description: `Cancelled vendor invoice ${invoice.invoiceNo}${reason ? `: ${reason}` : ''}`,
      oldValues: { status: invoice.status },
      newValues: { status: 'CANCELLED', reason: reason || null },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
