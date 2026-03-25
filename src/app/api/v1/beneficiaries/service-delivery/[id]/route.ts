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

    const delivery = await prisma.serviceDelivery.findFirst({
      where: {
        id,
        beneficiary: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        serviceNo: true,
        serviceType: true,
        date: true,
        location: true,
        deliveredById: true,
        quantity: true,
        value: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        beneficiary: {
          select: {
            id: true,
            name: true,
            beneficiaryNo: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!delivery) {
      return apiNotFound('Service delivery not found')
    }

    return apiSuccess(delivery)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.serviceDelivery.findFirst({
      where: {
        id,
        beneficiary: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
    })

    if (!existing) {
      return apiNotFound('Service delivery not found')
    }

    const body = await request.json()

    const allowedFields = [
      'status',
      'notes',
      'quantity',
      'value',
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

    const updated = await prisma.serviceDelivery.update({
      where: { id },
      data,
      select: {
        id: true,
        serviceNo: true,
        serviceType: true,
        date: true,
        location: true,
        deliveredById: true,
        quantity: true,
        value: true,
        status: true,
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
