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

    const grouped = await prisma.pFContribution.groupBy({
      by: ['year', 'month'],
      where: { organizationId: auth.organizationId },
      _sum: {
        employeeAmount: true,
        employerAmount: true,
        totalAmount: true,
      },
      _count: {
        employeeId: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      skip,
      take: limit,
    })

    const totalGroups = await prisma.pFContribution.groupBy({
      by: ['year', 'month'],
      where: { organizationId: auth.organizationId },
    })

    const runs = grouped.map((run) => ({
      id: `${run.year}-${String(run.month).padStart(2, '0')}`,
      month: run.month,
      year: run.year,
      period: `${run.month}/${run.year}`,
      totalEmployee: Number(run._sum.employeeAmount ?? 0),
      totalEmployer: Number(run._sum.employerAmount ?? 0),
      totalAmount: Number(run._sum.totalAmount ?? 0),
      employeeCount: run._count.employeeId,
      status: 'PROCESSED',
    }))

    return apiPaginated(runs, totalGroups.length, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
