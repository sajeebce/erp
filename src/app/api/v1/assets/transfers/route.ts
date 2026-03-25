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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      asset: { category: { organizationId: auth.organizationId } },
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const assetId = url.searchParams.get('assetId')
    if (assetId) where.assetId = assetId

    const [transfers, total] = await Promise.all([
      prisma.assetTransfer.findMany({
        where,
        include: {
          asset: { select: { id: true, assetNo: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assetTransfer.count({ where }),
    ])

    return apiPaginated(transfers, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { assetId, date, fromLocation, toLocation, reason } = body

    if (!assetId || !date || !fromLocation || !toLocation) {
      return apiBadRequest('assetId, date, fromLocation, and toLocation are required')
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

    const transferNo = await generateNextNumber(auth.organizationId, 'asset_transfer')

    const transfer = await prisma.assetTransfer.create({
      data: {
        transferNo,
        assetId,
        date: new Date(date),
        fromLocation,
        toLocation,
        reason: reason || null,
        transferredById: auth.userId,
        status: 'PENDING_APPROVAL',
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset_transfer',
      resourceId: transfer.id,
      description: `Created transfer ${transferNo} for asset "${asset.name}"`,
      newValues: { transferNo, assetId, fromLocation, toLocation },
      ...auditCtx,
    })

    return apiCreated(transfer)
  } catch (error) {
    return handleRouteError(error)
  }
}
