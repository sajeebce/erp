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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, [
      'ADMIN',
      'FINANCE_ADMIN',
      'FINANCE_HEAD',
    ])
    const { id } = await params

    // Verify voucher belongs to this org via organizationId
    const voucher = await prisma.voucher.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!voucher) {
      return apiNotFound('Voucher not found')
    }

    if (voucher.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT vouchers can be rejected. Current status: ' + voucher.status)
    }

    const body = await request.json().catch(() => ({}))
    const reason = body?.reason || null

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'REJECT',
      module: 'finance',
      resource: 'voucher',
      resourceId: id,
      description: `Rejected voucher ${voucher.voucherNo}${reason ? ': ' + reason : ''}`,
      oldValues: { status: 'DRAFT' },
      newValues: { status: 'REJECTED', reason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
