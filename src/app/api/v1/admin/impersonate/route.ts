import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import { signAccessToken } from '@/lib/auth/jwt'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const body = await request.json()
    const { organizationId, targetUserId } = body

    if (!organizationId || !targetUserId) {
      return apiBadRequest('organizationId and targetUserId are required')
    }

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, isActive: true },
    })

    if (!organization) {
      return apiNotFound('Organization not found')
    }

    if (!organization.isActive) {
      return apiBadRequest('Cannot impersonate users in an inactive organization')
    }

    // Validate user exists in that organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId,
      },
      include: {
        role: { select: { id: true, name: true } },
      },
    })

    if (!targetUser) {
      return apiNotFound('User not found in the specified organization')
    }

    if (targetUser.status !== 'ACTIVE') {
      return apiBadRequest('Cannot impersonate an inactive user')
    }

    // Check for existing active impersonation session for this super admin
    const existingSession = await prisma.impersonationSession.findFirst({
      where: {
        superAdminId: session.superAdminId,
        endedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingSession) {
      return apiBadRequest('You already have an active impersonation session. End it first before starting a new one.')
    }

    // Create impersonation session (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    const impersonationSession = await prisma.impersonationSession.create({
      data: {
        superAdminId: session.superAdminId,
        organizationId,
        targetUserId,
        targetRole: targetUser.role.name,
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    // Sign an access token for the target user with impersonation flag
    const accessToken = await signAccessToken({
      userId: targetUser.id,
      organizationId,
      roleId: targetUser.role.id,
      roleName: targetUser.role.name,
      isImpersonating: true,
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'START_IMPERSONATION',
        entityType: 'ImpersonationSession',
        entityId: impersonationSession.id,
        details: {
          organizationId,
          organizationName: organization.name,
          targetUserId,
          targetUserName: targetUser.fullName,
          targetRole: targetUser.role.name,
          expiresAt: expiresAt.toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess({
      sessionId: impersonationSession.id,
      accessToken,
      expiresAt,
      targetUser: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    // Find active (not ended) impersonation session for this super admin
    const activeSession = await prisma.impersonationSession.findFirst({
      where: {
        superAdminId: session.superAdminId,
        endedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!activeSession) {
      return apiNotFound('No active impersonation session found')
    }

    const updated = await prisma.impersonationSession.update({
      where: { id: activeSession.id },
      data: { endedAt: new Date() },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'END_IMPERSONATION',
        entityType: 'ImpersonationSession',
        entityId: activeSession.id,
        details: {
          organizationId: activeSession.organizationId,
          targetUserId: activeSession.targetUserId,
          targetRole: activeSession.targetRole,
          sessionDuration: Math.round(
            (updated.endedAt!.getTime() - activeSession.createdAt.getTime()) / 1000
          ),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess({
      sessionId: activeSession.id,
      endedAt: updated.endedAt,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
