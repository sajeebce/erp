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

    const enrollment = await prisma.beneficiaryEnrollment.findFirst({
      where: {
        id,
        beneficiary: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        enrollmentNo: true,
        programName: true,
        enrollmentDate: true,
        graduationDate: true,
        servicesAssigned: true,
        status: true,
        dropoutReason: true,
        notes: true,
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
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
            status: true,
          },
        },
      },
    })

    if (!enrollment) {
      return apiNotFound('Enrollment not found')
    }

    return apiSuccess(enrollment)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.beneficiaryEnrollment.findFirst({
      where: {
        id,
        beneficiary: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
    })

    if (!existing) {
      return apiNotFound('Enrollment not found')
    }

    const body = await request.json()

    const allowedFields = [
      'status',
      'graduationDate',
      'dropoutReason',
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

    // If status is GRADUATED and no graduationDate provided, set it to now
    if (data.status === 'GRADUATED' && !data.graduationDate && !existing.graduationDate) {
      data.graduationDate = new Date()
    }

    if (data.graduationDate !== undefined && data.graduationDate !== null) {
      data.graduationDate = new Date(data.graduationDate as string)
    }

    const updated = await prisma.beneficiaryEnrollment.update({
      where: { id },
      data,
      select: {
        id: true,
        enrollmentNo: true,
        programName: true,
        enrollmentDate: true,
        graduationDate: true,
        servicesAssigned: true,
        status: true,
        dropoutReason: true,
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
