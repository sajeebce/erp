import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiNotFound,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    if (organization.isActive) {
      return apiBadRequest('Organization is already active')
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { isActive: true },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'ACTIVATE_ORGANIZATION',
        entityType: 'Organization',
        entityId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isActive: updated.isActive,
      message: 'Organization has been activated',
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
