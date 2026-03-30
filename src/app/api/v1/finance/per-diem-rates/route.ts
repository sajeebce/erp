import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const location = url.searchParams.get('location')
    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const donorId = url.searchParams.get('donorId')
    if (donorId) {
      where.donorId = donorId
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const rates = await prisma.perDiemRate.findMany({
      where,
      select: {
        id: true,
        name: true,
        location: true,
        locationType: true,
        donorId: true,
        fullDayRate: true,
        halfDayRate: true,
        overnightRate: true,
        mealsOnlyRate: true,
        currencyCode: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ location: 'asc' }, { effectiveFrom: 'desc' }],
    })

    return apiSuccess(rates)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      location,
      fullDayRate,
      effectiveFrom,
      locationType,
      donorId,
      halfDayRate,
      overnightRate,
      mealsOnlyRate,
      currencyCode,
      effectiveTo,
      notes,
    } = body

    if (!name || !location || fullDayRate === undefined || !effectiveFrom) {
      return apiBadRequest('name, location, fullDayRate, and effectiveFrom are required')
    }

    if (typeof fullDayRate !== 'number' || fullDayRate <= 0) {
      return apiBadRequest('fullDayRate must be a positive number')
    }

    if (halfDayRate !== undefined && (typeof halfDayRate !== 'number' || halfDayRate < 0)) {
      return apiBadRequest('halfDayRate must be a non-negative number')
    }

    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      return apiBadRequest('effectiveTo must be after effectiveFrom')
    }

    const rate = await prisma.perDiemRate.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        location: location.trim(),
        locationType: locationType || 'DISTRICT',
        donorId: donorId || null,
        fullDayRate,
        halfDayRate: halfDayRate ?? null,
        overnightRate: overnightRate ?? null,
        mealsOnlyRate: mealsOnlyRate ?? null,
        currencyCode: currencyCode || 'BDT',
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        notes: notes || null,
      },
      select: {
        id: true,
        name: true,
        location: true,
        locationType: true,
        donorId: true,
        fullDayRate: true,
        halfDayRate: true,
        overnightRate: true,
        mealsOnlyRate: true,
        currencyCode: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(rate)
  } catch (error) {
    return handleRouteError(error)
  }
}
