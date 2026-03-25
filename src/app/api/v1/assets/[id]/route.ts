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

    const asset = await prisma.asset.findFirst({
      where: {
        id,
        deletedAt: null,
        category: { organizationId: auth.organizationId },
      },
      include: {
        category: true,
        warehouse: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, projectNo: true, name: true } },
        depreciationRecords: { orderBy: { period: 'desc' }, take: 24 },
        transfers: { orderBy: { createdAt: 'desc' } },
        maintenanceRecords: { orderBy: { scheduledDate: 'desc' } },
        disposal: true,
      },
    })

    if (!asset) {
      return apiNotFound('Asset not found')
    }

    return apiSuccess(asset)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.asset.findFirst({
      where: {
        id,
        deletedAt: null,
        category: { organizationId: auth.organizationId },
      },
    })
    if (!existing) {
      return apiNotFound('Asset not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.description !== undefined) data.description = body.description || null
    if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber || null
    if (body.barcode !== undefined) data.barcode = body.barcode || null
    if (body.condition !== undefined) data.condition = body.condition
    if (body.warehouseId !== undefined) data.warehouseId = body.warehouseId || null
    if (body.custodianId !== undefined) data.custodianId = body.custodianId || null
    if (body.projectId !== undefined) data.projectId = body.projectId || null
    if (body.donorId !== undefined) data.donorId = body.donorId || null
    if (body.insuranceInfo !== undefined) data.insuranceInfo = body.insuranceInfo || null
    if (body.warrantyExpiry !== undefined) data.warrantyExpiry = body.warrantyExpiry ? new Date(body.warrantyExpiry) : null
    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.purchasePrice !== undefined) data.purchasePrice = new Prisma.Decimal(body.purchasePrice)

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.asset.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'asset',
      resource: 'asset',
      resourceId: id,
      description: `Updated asset "${updated.name}"`,
      oldValues: { name: existing.name, condition: existing.condition },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
