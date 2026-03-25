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

    const grievance = await prisma.grievance.findFirst({
      where: {
        id,
        OR: [
          {
            beneficiary: {
              organizationId: auth.organizationId,
              deletedAt: null,
            },
          },
          {
            beneficiaryId: null,
          },
        ],
      },
      select: {
        id: true,
        grievanceNo: true,
        date: true,
        complainantName: true,
        category: true,
        description: true,
        severity: true,
        assignedToId: true,
        resolutionDate: true,
        resolutionNotes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        beneficiary: {
          select: {
            id: true,
            name: true,
            beneficiaryNo: true,
            phone: true,
            district: true,
          },
        },
      },
    })

    if (!grievance) {
      return apiNotFound('Grievance not found')
    }

    return apiSuccess(grievance)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.grievance.findFirst({
      where: {
        id,
        OR: [
          {
            beneficiary: {
              organizationId: auth.organizationId,
              deletedAt: null,
            },
          },
          {
            beneficiaryId: null,
          },
        ],
      },
    })

    if (!existing) {
      return apiNotFound('Grievance not found')
    }

    const body = await request.json()

    const allowedFields = [
      'assignedToId',
      'resolutionDate',
      'resolutionNotes',
      'status',
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

    // If status is RESOLVED and no resolutionDate, set it to now
    if (data.status === 'RESOLVED' && !data.resolutionDate && !existing.resolutionDate) {
      data.resolutionDate = new Date()
    }

    if (data.resolutionDate !== undefined && data.resolutionDate !== null && !(data.resolutionDate instanceof Date)) {
      data.resolutionDate = new Date(data.resolutionDate as string)
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data,
      select: {
        id: true,
        grievanceNo: true,
        date: true,
        complainantName: true,
        category: true,
        description: true,
        severity: true,
        assignedToId: true,
        resolutionDate: true,
        resolutionNotes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        beneficiary: {
          select: {
            id: true,
            name: true,
            beneficiaryNo: true,
          },
        },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
