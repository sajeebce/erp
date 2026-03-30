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

    const [ledgers, total] = await Promise.all([
      prisma.gratuityLedger.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              joiningDate: true,
              basicSalary: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gratuityLedger.count({ where }),
    ])

    const now = new Date()
    const result = ledgers.map((l) => {
      const serviceMs = now.getTime() - new Date(l.serviceStartDate).getTime()
      const serviceYears = Math.floor(serviceMs / (365.25 * 24 * 60 * 60 * 1000) * 100) / 100
      return { ...l, serviceYears }
    })

    return apiPaginated(result, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
