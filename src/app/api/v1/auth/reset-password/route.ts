import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, validatePassword } from '@/lib/auth'
import { apiMessage, apiBadRequest, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userId, orgSlug, newPassword } = body

    if (!token || !userId || !orgSlug || !newPassword) {
      return apiBadRequest('Token, userId, orgSlug, and newPassword are required')
    }

    // Validate password policy
    const passwordCheck = validatePassword(newPassword)
    if (!passwordCheck.valid) {
      return apiBadRequest('Password does not meet requirements', { password: passwordCheck.errors })
    }

    // Find org
    const org = await prisma.organization.findFirst({
      where: { OR: [{ slug: orgSlug }, { customDomain: orgSlug }], isActive: true },
    })

    if (!org) {
      return apiBadRequest('Invalid or expired reset link')
    }

    // Find stored reset token
    const configKey = `password_reset:${userId}`
    const config = await prisma.systemConfig.findUnique({
      where: { organizationId_key: { organizationId: org.id, key: configKey } },
    })

    if (!config) {
      return apiBadRequest('Invalid or expired reset link')
    }

    const resetData = JSON.parse(config.value) as { token: string; expiresAt: string }

    if (resetData.token !== token) {
      return apiBadRequest('Invalid or expired reset link')
    }

    if (new Date(resetData.expiresAt) < new Date()) {
      // Clean up expired token
      await prisma.systemConfig.delete({
        where: { organizationId_key: { organizationId: org.id, key: configKey } },
      })
      return apiBadRequest('Reset link has expired. Please request a new one.')
    }

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    })

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    })

    // Clean up reset token
    await prisma.systemConfig.delete({
      where: { organizationId_key: { organizationId: org.id, key: configKey } },
    })

    return apiMessage('Password has been reset successfully. Please log in with your new password.')
  } catch (error) {
    return handleRouteError(error)
  }
}
