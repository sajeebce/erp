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

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: {
        id: true,
        contractNo: true,
        title: true,
        vendorId: true,
        vendor: {
          select: { id: true, vendorNo: true, companyName: true },
        },
        type: true,
        startDate: true,
        endDate: true,
        value: true,
        status: true,
        description: true,
        terms: true,
        renewalDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!contract) {
      return apiNotFound('Contract not found')
    }

    return apiSuccess(contract)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.contract.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Contract not found')
    }

    const body = await request.json()

    const allowedFields = [
      'title', 'type', 'startDate', 'endDate', 'value',
      'status', 'description', 'terms', 'renewalDate', 'notes',
    ] as const

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['startDate', 'endDate', 'renewalDate'].includes(field)) {
          data[field] = body[field] ? new Date(body[field]) : null
        } else {
          data[field] = body[field]
        }
      }
    }

    if (data.type !== undefined) {
      const validTypes = ['SUPPLY', 'SERVICE', 'WORKS', 'CONSULTANCY']
      if (!validTypes.includes(data.type as string)) {
        return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
      }
    }

    if (data.status !== undefined) {
      const validStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'UNDER_RENEWAL', 'TERMINATED']
      if (!validStatuses.includes(data.status as string)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.contract.update({
      where: { id },
      data,
      select: {
        id: true,
        contractNo: true,
        title: true,
        vendorId: true,
        type: true,
        startDate: true,
        endDate: true,
        value: true,
        status: true,
        description: true,
        terms: true,
        renewalDate: true,
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
