import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const rate = await prisma.perDiemRate.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
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

    if (!rate) {
      return apiNotFound('Per diem rate not found')
    }

    return apiSuccess(rate)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.perDiemRate.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Per diem rate not found')
    }

    const body = await request.json()

    const allowedFields = [
      'name', 'location', 'locationType', 'donorId',
      'fullDayRate', 'halfDayRate', 'overnightRate', 'mealsOnlyRate',
      'currencyCode', 'effectiveFrom', 'effectiveTo', 'isActive', 'notes',
    ] as const

    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return apiBadRequest('name must be a non-empty string')
      }
      data.name = (data.name as string).trim()
    }

    // Validate location if provided
    if (data.location !== undefined) {
      if (typeof data.location !== 'string' || data.location.trim().length === 0) {
        return apiBadRequest('location must be a non-empty string')
      }
      data.location = (data.location as string).trim()
    }

    // Validate rates
    if (data.fullDayRate !== undefined && (typeof data.fullDayRate !== 'number' || data.fullDayRate <= 0)) {
      return apiBadRequest('fullDayRate must be a positive number')
    }

    if (data.halfDayRate !== undefined && data.halfDayRate !== null && (typeof data.halfDayRate !== 'number' || data.halfDayRate < 0)) {
      return apiBadRequest('halfDayRate must be a non-negative number')
    }

    // Convert date strings to Date objects
    if (data.effectiveFrom !== undefined) {
      data.effectiveFrom = new Date(data.effectiveFrom as string)
    }
    if (data.effectiveTo !== undefined && data.effectiveTo !== null) {
      data.effectiveTo = new Date(data.effectiveTo as string)
    }

    const updated = await prisma.perDiemRate.update({
      where: { id },
      data,
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

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.perDiemRate.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existing) {
      return apiNotFound('Per diem rate not found')
    }

    const updated = await prisma.perDiemRate.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        location: true,
        isActive: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
