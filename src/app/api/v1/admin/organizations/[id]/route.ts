import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
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
    const session = await requireSuperAdminFromRequest(request)
    void session

    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            numberSequences: true,
            fiscalYears: true,
          },
        },
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    return apiSuccess({
      ...organization,
      storageUsedBytes: organization.storageUsedBytes.toString(),
      bandwidthUsedBytes: organization.bandwidthUsedBytes.toString(),
      userCount: organization._count.users,
      numberSequenceCount: organization._count.numberSequences,
      fiscalYearCount: organization._count.fiscalYears,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

const UPDATABLE_FIELDS = [
  'name',
  'localizedName',
  'registrationNo',
  'ngoabLicenseNo',
  'mraLicenseNo',
  'vatRegistrationNo',
  'tin',
  'address',
  'district',
  'phone',
  'email',
  'website',
] as const

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const { id } = await params

    const existing = await prisma.organization.findUnique({
      where: { id },
    })

    if (!existing) {
      return apiNotFound('Organization not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}
    for (const field of UPDATABLE_FIELDS) {
      if (field in body) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || (data.name as string).trim().length < 2) {
        return apiBadRequest('Name must be at least 2 characters')
      }
      data.name = (data.name as string).trim()
    }

    if (data.email !== undefined && data.email !== null) {
      const emailStr = data.email as string
      if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        return apiBadRequest('Invalid email format')
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data,
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'UPDATE_ORGANIZATION',
        entityType: 'Organization',
        entityId: organization.id,
        details: { updatedFields: Object.keys(data) },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}
