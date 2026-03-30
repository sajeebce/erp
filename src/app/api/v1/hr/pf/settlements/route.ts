import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated, handleRouteError, parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Prisma.PFSettlementWhereInput = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [settlements, total] = await Promise.all([
      prisma.pFSettlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pFSettlement.count({ where }),
    ])

    return apiPaginated(settlements, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
