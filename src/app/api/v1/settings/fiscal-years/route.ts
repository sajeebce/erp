import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: {
        organizationId: auth.organizationId,
      },
      include: {
        _count: {
          select: { fiscalPeriods: true },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    const data = fiscalYears.map((fy) => ({
      id: fy.id,
      name: fy.name,
      startDate: fy.startDate,
      endDate: fy.endDate,
      isCurrent: fy.isCurrent,
      isClosed: fy.isClosed,
      periodCount: fy._count.fiscalPeriods,
      createdAt: fy.createdAt,
      updatedAt: fy.updatedAt,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()
    const { name, startDate, endDate } = body

    if (!name || !startDate || !endDate) {
      return apiBadRequest('name, startDate, and endDate are required')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return apiBadRequest('Invalid date format for startDate or endDate')
    }

    if (end <= start) {
      return apiBadRequest('endDate must be after startDate')
    }

    // Validate no overlap with existing fiscal years
    const overlapping = await prisma.fiscalYear.findFirst({
      where: {
        organizationId: auth.organizationId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    })

    if (overlapping) {
      return apiConflict(
        `Date range overlaps with existing fiscal year "${overlapping.name}" (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]})`
      )
    }

    // Check if this is the first fiscal year for this org
    const existingCount = await prisma.fiscalYear.count({
      where: { organizationId: auth.organizationId },
    })

    const isFirst = existingCount === 0

    // Auto-create 12 monthly fiscal periods
    const periods: {
      name: string
      periodNumber: number
      startDate: Date
      endDate: Date
    }[] = []

    const periodStart = new Date(start)
    for (let i = 1; i <= 12; i++) {
      const periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      periodEnd.setDate(periodEnd.getDate() - 1)

      // Ensure the last period doesn't exceed the fiscal year end
      const effectiveEnd = periodEnd > end ? end : periodEnd

      periods.push({
        name: `Period ${i}`,
        periodNumber: i,
        startDate: new Date(periodStart),
        endDate: effectiveEnd,
      })

      // Move to next month
      periodStart.setMonth(periodStart.getMonth() + 1)

      // If we've gone past the end date, stop
      if (periodStart > end) break
    }

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        startDate: start,
        endDate: end,
        isCurrent: isFirst,
        fiscalPeriods: {
          create: periods,
        },
      },
      include: {
        fiscalPeriods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    return apiCreated(fiscalYear)
  } catch (error) {
    return handleRouteError(error)
  }
}
