import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const donor = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        relationshipStatus: true,
        totalFunded: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        contacts: {
          select: {
            id: true,
            name: true,
            designation: true,
            email: true,
            phone: true,
            isPrimary: true,
          },
        },
        grants: {
          where: { deletedAt: null },
          select: {
            id: true,
            grantNo: true,
            title: true,
            awardAmount: true,
            disbursedAmount: true,
            currencyCode: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!donor) {
      return apiNotFound('Donor not found')
    }

    return apiSuccess(donor)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Donor not found')
    }

    const body = await request.json()

    const allowedFields = [
      'name',
      'type',
      'country',
      'address',
      'phone',
      'email',
      'website',
      'description',
      'relationshipStatus',
      'isActive',
      'notes',
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

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = (data.name as string).trim()
    }

    if (data.type !== undefined) {
      const validTypes = [
        'BILATERAL',
        'MULTILATERAL',
        'FOUNDATION',
        'CORPORATE',
        'INDIVIDUAL',
        'GOVERNMENT',
        'INGO',
      ]
      if (!validTypes.includes(data.type as string)) {
        return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
      }
    }

    const updated = await prisma.donor.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        country: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        relationshipStatus: true,
        totalFunded: true,
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
