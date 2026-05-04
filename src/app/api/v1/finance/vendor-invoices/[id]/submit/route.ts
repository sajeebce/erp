import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { startApproval } from '@/lib/approval-engine'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VENDOR_INVOICE_WORKFLOW_NAME = 'Vendor Invoice Approval'

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN'])
    const { id } = await params

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        netPayable: true,
        createdById: true,
      },
    })

    if (!invoice) return apiNotFound('Vendor invoice not found')
    if (invoice.status !== 'MATCHED' && invoice.status !== 'SUBMITTED') {
      return apiBadRequest(`Only MATCHED or SUBMITTED invoices can be submitted for approval. Current status: ${invoice.status}`)
    }

    const approval = await startApproval({
      organizationId: auth.organizationId,
      workflowName: VENDOR_INVOICE_WORKFLOW_NAME,
      entityType: 'VENDOR_INVOICE',
      entityId: invoice.id,
      requestedById: invoice.createdById,
      amount: Number(invoice.netPayable),
    })

    const updated = await prisma.vendorInvoice.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
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
      description: `Submitted vendor invoice ${invoice.invoiceNo} for approval`,
      oldValues: { status: invoice.status },
      newValues: { status: 'SUBMITTED', approvalInstanceId: approval.instanceId },
      ...auditCtx,
    })

    return apiSuccess({ ...updated, approval })
  } catch (error) {
    return handleRouteError(error)
  }
}
