import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    const { orgId } = await params

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, customDomain: true, domainVerified: true },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    const body = await request.json()
    const { action } = body

    if (!action || !['verify', 'revoke'].includes(action)) {
      return apiBadRequest('action must be "verify" or "revoke"')
    }

    if (action === 'verify') {
      if (!organization.customDomain) {
        return apiBadRequest('Organization does not have a custom domain configured')
      }

      const updated = await prisma.organization.update({
        where: { id: orgId },
        data: { domainVerified: true },
        select: { id: true, name: true, slug: true, customDomain: true, domainVerified: true },
      })

      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.superAdminId,
          action: 'VERIFY_DOMAIN',
          entityType: 'Organization',
          entityId: orgId,
          details: {
            organizationName: organization.name,
            customDomain: organization.customDomain,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })

      return apiSuccess(updated)
    }

    // action === 'revoke'
    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        customDomain: null,
        domainVerified: false,
      },
      select: { id: true, name: true, slug: true, customDomain: true, domainVerified: true },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'REVOKE_DOMAIN',
        entityType: 'Organization',
        entityId: orgId,
        details: {
          organizationName: organization.name,
          previousDomain: organization.customDomain,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
