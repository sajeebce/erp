import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
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

    const assetId = url.searchParams.get('assetId')
    if (assetId) where.assetId = assetId

    const period = url.searchParams.get('period')
    if (period) where.period = new Date(period)

    const [records, total] = await Promise.all([
      prisma.assetDepreciation.findMany({
        where,
        include: {
          asset: { select: { id: true, assetNo: true, name: true } },
        },
        orderBy: { period: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assetDepreciation.count({ where }),
    ])

    return apiPaginated(records, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
