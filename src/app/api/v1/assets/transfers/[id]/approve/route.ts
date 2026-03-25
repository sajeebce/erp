import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
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
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const transfer = await prisma.assetTransfer.findFirst({
      where: {
        id,
        asset: { category: { organizationId: auth.organizationId } },
      },
    })

    if (!transfer) {
      return apiNotFound('Transfer not found')
    }

    if (transfer.status !== 'PENDING_APPROVAL') {
      return apiBadRequest('Transfer is not pending approval')
    }

    const updated = await prisma.assetTransfer.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'asset',
      resource: 'asset_transfer',
      resourceId: id,
      description: `Approved transfer ${transfer.transferNo}`,
      oldValues: { status: 'PENDING_APPROVAL' },
      newValues: { status: 'APPROVED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
