import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        beneficiaryNo: true,
        name: true,
        fatherSpouseName: true,
        dateOfBirth: true,
        age: true,
        gender: true,
        nidNumber: true,
        phone: true,
        division: true,
        district: true,
        upazila: true,
        union: true,
        village: true,
        address: true,
        photo: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          select: {
            id: true,
            enrollmentNo: true,
            programName: true,
            enrollmentDate: true,
            graduationDate: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            serviceDeliveries: true,
            grievances: true,
          },
        },
      },
    })

    if (!beneficiary) {
      return apiNotFound('Beneficiary not found')
    }

    return apiSuccess(beneficiary)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.beneficiary.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Beneficiary not found')
    }

    const body = await request.json()

    const allowedFields = [
      'name',
      'fatherSpouseName',
      'dateOfBirth',
      'age',
      'gender',
      'nidNumber',
      'phone',
      'division',
      'district',
      'upazila',
      'union',
      'village',
      'address',
      'photo',
      'status',
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

    // Check NID uniqueness within org if changed
    if (data.nidNumber !== undefined && data.nidNumber !== null && data.nidNumber !== existing.nidNumber) {
      const existingNid = await prisma.beneficiary.findFirst({
        where: {
          organizationId: auth.organizationId,
          nidNumber: data.nidNumber as string,
          deletedAt: null,
          id: { not: id },
        },
      })
      if (existingNid) {
        return apiConflict('A beneficiary with this NID number already exists in this organization')
      }
    }

    if (data.dateOfBirth !== undefined && data.dateOfBirth !== null) {
      data.dateOfBirth = new Date(data.dateOfBirth as string)
    }

    const updated = await prisma.beneficiary.update({
      where: { id },
      data,
      select: {
        id: true,
        beneficiaryNo: true,
        name: true,
        fatherSpouseName: true,
        dateOfBirth: true,
        age: true,
        gender: true,
        nidNumber: true,
        phone: true,
        division: true,
        district: true,
        upazila: true,
        union: true,
        village: true,
        address: true,
        photo: true,
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
