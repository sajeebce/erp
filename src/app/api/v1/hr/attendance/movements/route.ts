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
      organizationId: auth.organizationId,
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) where.employeeId = employeeId

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const month = url.searchParams.get('month')
    if (month) {
      const [year, monthNo] = month.split('-').map(Number)
      if (!Number.isNaN(year) && !Number.isNaN(monthNo)) {
        const startDate = new Date(year, monthNo - 1, 1)
        const endDate = new Date(year, monthNo, 0, 23, 59, 59)
        where.checkOutTime = { gte: startDate, lte: endDate }
      }
    }

    const [movements, total] = await Promise.all([
      prisma.attendanceMovement.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              department: { select: { id: true, name: true } },
            },
          },
          operatingLocation: { select: { id: true, code: true, name: true } },
          attendance: { select: { id: true, date: true, status: true } },
        },
        orderBy: { checkOutTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendanceMovement.count({ where }),
    ])

    return apiPaginated(movements, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
