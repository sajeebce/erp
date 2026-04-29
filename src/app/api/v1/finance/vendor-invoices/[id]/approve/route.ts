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
    const body = await request.json().catch(() => ({}))

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, invoiceNo: true, status: true },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')
    if (invoice.status !== 'MATCHED' && invoice.status !== 'SUBMITTED') {
      return apiBadRequest(`Only MATCHED or SUBMITTED invoices can be approved. Current status: ${invoice.status}`)
    }

    const now = new Date()
    const updated = await prisma.vendorInvoice.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: now,
        notes: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined,
      },
      include: { grns: true, payments: true },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'FINANCE',
      resource: 'VendorInvoice',
      resourceId: id,
      description: `Approved vendor invoice ${invoice.invoiceNo}`,
      oldValues: { status: invoice.status },
      newValues: { status: 'APPROVED', approvedAt: now },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
