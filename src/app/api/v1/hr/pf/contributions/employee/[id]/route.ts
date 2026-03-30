import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated, handleRouteError, parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where = {
      organizationId: auth.organizationId,
      employeeId,
    }

    const [contributions, total] = await Promise.all([
      prisma.pFContribution.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.pFContribution.count({ where }),
    ])

    return apiPaginated(contributions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
