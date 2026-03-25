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

    const [disposals, total] = await Promise.all([
      prisma.assetDisposal.findMany({
        where,
        include: {
          asset: { select: { id: true, assetNo: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assetDisposal.count({ where }),
    ])

    return apiPaginated(disposals, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { assetId, date, method, reason } = body

    if (!assetId || !date || !method) {
      return apiBadRequest('assetId, date, and method are required')
    }

    const validMethods = ['SALE', 'AUCTION', 'SCRAP', 'DONATION', 'WRITE_OFF']
    if (!validMethods.includes(method)) {
      return apiBadRequest(`method must be one of: ${validMethods.join(', ')}`)
    }

    // Validate asset belongs to org and not already disposed
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        deletedAt: null,
        disposedAt: null,
        category: { organizationId: auth.organizationId },
      },
    })
    if (!asset) {
      return apiBadRequest('Asset not found or already disposed')
    }

    // Check no existing disposal
    const existingDisposal = await prisma.assetDisposal.findUnique({
      where: { assetId },
    })
    if (existingDisposal) {
      return apiBadRequest('Disposal record already exists for this asset')
    }

    const disposalNo = await generateNextNumber(auth.organizationId, 'asset_disposal')

    const disposal = await prisma.assetDisposal.create({
      data: {
        disposalNo,
        assetId,
        date: new Date(date),
        method,
        originalValue: asset.purchasePrice,
        bookValueAtDisposal: asset.netBookValue,
        recoveryAmount: body.recoveryAmount ? new Prisma.Decimal(body.recoveryAmount) : new Prisma.Decimal(0),
        buyerInfo: body.buyerInfo || null,
        reason: reason || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset_disposal',
      resourceId: disposal.id,
      description: `Created disposal ${disposalNo} for asset "${asset.name}"`,
      newValues: { disposalNo, assetId, method },
      ...auditCtx,
    })

    return apiCreated(disposal)
  } catch (error) {
    return handleRouteError(error)
  }
}
