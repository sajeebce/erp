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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const category = await prisma.assetCategory.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        _count: { select: { assets: true } },
      },
    })

    if (!category) {
      return apiNotFound('Asset category not found')
    }

    return apiSuccess(category)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.assetCategory.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Asset category not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name.trim()
    if (body.usefulLifeYears !== undefined) data.usefulLifeYears = body.usefulLifeYears
    if (body.depreciationMethod !== undefined) data.depreciationMethod = body.depreciationMethod
    if (body.depreciationRate !== undefined) data.depreciationRate = body.depreciationRate
    if (body.isActive !== undefined) data.isActive = body.isActive

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.assetCategory.update({
      where: { id },
      data,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'asset',
      resource: 'asset_category',
      resourceId: id,
      description: `Updated asset category "${updated.name}"`,
      oldValues: { name: existing.name, depreciationRate: existing.depreciationRate },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
