import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { startDate, endDate, location, donorId } = body

    if (!startDate || !endDate || !location) {
      return apiBadRequest('startDate, endDate, and location are required')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return apiBadRequest('endDate must be on or after startDate')
    }

    // Find the applicable per diem rate
    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      location: { contains: location, mode: 'insensitive' },
      isActive: true,
      effectiveFrom: { lte: start },
    }

    if (donorId) {
      where.donorId = donorId
    }

    const rate = await prisma.perDiemRate.findFirst({
      where: {
        ...where,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: end } },
        ],
      },
      select: {
        id: true,
        name: true,
        location: true,
        fullDayRate: true,
        halfDayRate: true,
        currencyCode: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    })

    if (!rate) {
      return apiNotFound('No applicable per diem rate found for the given location, dates, and donor')
    }

    // Calculate days
    // Total calendar days inclusive
    const msPerDay = 24 * 60 * 60 * 1000
    const totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1

    let fullDays: number
    let halfDays: number

    if (totalDays === 1) {
      // Single day trip = 1 full day
      fullDays = 1
      halfDays = 0
    } else {
      // Multi-day trip: first and last day are half-days
      halfDays = 2
      fullDays = totalDays - 2
    }

    const fullDayRate = Number(rate.fullDayRate)
    const halfDayRate = rate.halfDayRate ? Number(rate.halfDayRate) : fullDayRate / 2

    const totalAmount = (fullDays * fullDayRate) + (halfDays * halfDayRate)

    return apiSuccess({
      rate: {
        id: rate.id,
        name: rate.name,
        location: rate.location,
        fullDayRate,
        halfDayRate,
        currencyCode: rate.currencyCode,
      },
      calculation: {
        startDate,
        endDate,
        totalDays,
        fullDays,
        halfDays,
        ratePerDay: fullDayRate,
        halfDayRateUsed: halfDayRate,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
