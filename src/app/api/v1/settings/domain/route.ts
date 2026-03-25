import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const organization = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        customDomain: true,
        domainVerified: true,
        slug: true,
      },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()
    const { customDomain } = body

    if (!customDomain) {
      return apiBadRequest('Custom domain is required')
    }

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
    if (typeof customDomain !== 'string' || !domainRegex.test(customDomain)) {
      return apiBadRequest('Invalid domain format. Example: erp.myorganization.org')
    }

    const domain = customDomain.toLowerCase()

    // Check uniqueness globally
    const existingDomain = await prisma.organization.findFirst({
      where: {
        customDomain: domain,
        id: { not: auth.organizationId },
      },
    })

    if (existingDomain) {
      return apiConflict('This domain is already in use by another organization')
    }

    const organization = await prisma.organization.update({
      where: { id: auth.organizationId },
      data: {
        customDomain: domain,
        domainVerified: false,
      },
      select: {
        customDomain: true,
        domainVerified: true,
        slug: true,
      },
    })

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const organization = await prisma.organization.update({
      where: { id: auth.organizationId },
      data: {
        customDomain: null,
        domainVerified: false,
      },
      select: {
        customDomain: true,
        domainVerified: true,
        slug: true,
      },
    })

    return apiSuccess(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}
