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

    const where: Prisma.GratuityAccrualWhereInput = {
      organizationId: auth.organizationId,
    }

    const month = url.searchParams.get('month')
    const year = url.searchParams.get('year')
    const employeeId = url.searchParams.get('employeeId')

    if (month) where.accrualMonth = parseInt(month)
    if (year) where.accrualYear = parseInt(year)
    if (employeeId) where.employeeId = employeeId

    const [accruals, total] = await Promise.all([
      prisma.gratuityAccrual.findMany({
        where,
        orderBy: [{ accrualYear: 'desc' }, { accrualMonth: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.gratuityAccrual.count({ where }),
    ])

    return apiPaginated(accruals, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
