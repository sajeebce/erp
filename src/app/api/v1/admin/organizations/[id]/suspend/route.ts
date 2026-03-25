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

    if (!organization.isActive) {
      return apiBadRequest('Organization is already suspended')
    }

    let reason: string | undefined
    try {
      const body = await request.json()
      reason = body.reason
    } catch {
      // Body is optional
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { isActive: false },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'SUSPEND_ORGANIZATION',
        entityType: 'Organization',
        entityId: id,
        details: { reason: reason || 'No reason provided' },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isActive: updated.isActive,
      message: 'Organization has been suspended',
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
