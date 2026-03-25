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

    if (transfer.status !== 'APPROVED') {
      return apiBadRequest('Transfer must be approved before receiving')
    }

    const body = await request.json().catch(() => ({}))

    // Update transfer status and asset location
    const [updated] = await prisma.$transaction([
      prisma.assetTransfer.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          receivedAt: new Date(),
          notes: body.notes || transfer.notes,
        },
      }),
      prisma.asset.update({
        where: { id: transfer.assetId },
        data: {
          warehouseId: body.warehouseId || null,
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'asset',
      resource: 'asset_transfer',
      resourceId: id,
      description: `Received transfer ${transfer.transferNo}`,
      oldValues: { status: 'APPROVED' },
      newValues: { status: 'COMPLETED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
