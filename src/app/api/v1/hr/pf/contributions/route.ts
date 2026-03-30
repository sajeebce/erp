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

    const where: Prisma.PFContributionWhereInput = {
      organizationId: auth.organizationId,
    }

    const month = url.searchParams.get('month')
    const year = url.searchParams.get('year')
    const employeeId = url.searchParams.get('employeeId')

    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (employeeId) where.employeeId = employeeId

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
