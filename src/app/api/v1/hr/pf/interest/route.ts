import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated, handleRouteError, parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where = { organizationId: auth.organizationId }

    const [postings, total] = await Promise.all([
      prisma.pFInterestPosting.findMany({
        where,
        orderBy: { periodEnd: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pFInterestPosting.count({ where }),
    ])

    return apiPaginated(postings, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
