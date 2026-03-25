import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
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

    // Verify donor belongs to org
    const donor = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!donor) {
      return apiNotFound('Donor not found')
    }

    const contacts = await prisma.donorContact.findMany({
      where: { donorId: id },
      select: {
        id: true,
        name: true,
        designation: true,
        email: true,
        phone: true,
        isPrimary: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    })

    return apiSuccess(contacts)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify donor belongs to org
    const donor = await prisma.donor.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!donor) {
      return apiNotFound('Donor not found')
    }

    const body = await request.json()
    const { name, designation, email, phone, isPrimary } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    // If isPrimary, unset any existing primary contacts for this donor
    if (isPrimary) {
      await prisma.donorContact.updateMany({
        where: { donorId: id, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const contact = await prisma.donorContact.create({
      data: {
        donorId: id,
        name: name.trim(),
        designation: designation || null,
        email: email || null,
        phone: phone || null,
        isPrimary: isPrimary ?? false,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        email: true,
        phone: true,
        isPrimary: true,
      },
    })

    return apiCreated(contact)
  } catch (error) {
    return handleRouteError(error)
  }
}
