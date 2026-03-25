import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      asset: { category: { organizationId: auth.organizationId } },
    }

    const assetId = url.searchParams.get('assetId')
    if (assetId) where.assetId = assetId

    const type = url.searchParams.get('type')
    if (type) where.type = type

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [records, total] = await Promise.all([
      prisma.assetMaintenance.findMany({
        where,
        include: {
          asset: { select: { id: true, assetNo: true, name: true } },
        },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assetMaintenance.count({ where }),
    ])

    return apiPaginated(records, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { assetId, type, description, scheduledDate } = body

    if (!assetId || !type || !description || !scheduledDate) {
      return apiBadRequest('assetId, type, description, and scheduledDate are required')
    }

    const validTypes = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    // Validate asset belongs to org
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        deletedAt: null,
        category: { organizationId: auth.organizationId },
      },
      select: { id: true, name: true },
    })
    if (!asset) {
      return apiBadRequest('Asset not found in this organization')
    }

    const maintenanceNo = await generateNextNumber(auth.organizationId, 'asset_maintenance')

    const record = await prisma.assetMaintenance.create({
      data: {
        maintenanceNo,
        assetId,
        type,
        description,
        scheduledDate: new Date(scheduledDate),
        cost: body.cost ? new Prisma.Decimal(body.cost) : new Prisma.Decimal(0),
        vendorName: body.vendorName || null,
        status: 'SCHEDULED',
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset_maintenance',
      resourceId: record.id,
      description: `Created maintenance ${maintenanceNo} for asset "${asset.name}"`,
      newValues: { maintenanceNo, assetId, type },
      ...auditCtx,
    })

    return apiCreated(record)
  } catch (error) {
    return handleRouteError(error)
  }
}
