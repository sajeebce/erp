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
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const record = await prisma.assetMaintenance.findFirst({
      where: {
        id,
        asset: { category: { organizationId: auth.organizationId } },
      },
      include: {
        asset: { select: { id: true, assetNo: true, name: true, condition: true } },
      },
    })

    if (!record) {
      return apiNotFound('Maintenance record not found')
    }

    return apiSuccess(record)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.assetMaintenance.findFirst({
      where: {
        id,
        asset: { category: { organizationId: auth.organizationId } },
      },
    })
    if (!existing) {
      return apiNotFound('Maintenance record not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.status !== undefined) {
      const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status
    }

    if (body.completionDate !== undefined) data.completionDate = body.completionDate ? new Date(body.completionDate) : null
    if (body.cost !== undefined) data.cost = new Prisma.Decimal(body.cost)
    if (body.vendorName !== undefined) data.vendorName = body.vendorName || null
    if (body.description !== undefined) data.description = body.description
    if (body.notes !== undefined) data.notes = body.notes || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.assetMaintenance.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'asset',
      resource: 'asset_maintenance',
      resourceId: id,
      description: `Updated maintenance ${existing.maintenanceNo}`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
