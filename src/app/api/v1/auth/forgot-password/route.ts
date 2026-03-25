import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiMessage, apiBadRequest, handleRouteError } from '@/lib/api-response'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, orgSlug } = body

    if (!email || !orgSlug) {
      return apiBadRequest('Email and organization slug are required')
    }

    // Find organization
    const org = await prisma.organization.findFirst({
      where: {
        OR: [{ slug: orgSlug }, { customDomain: orgSlug }],
        isActive: true,
      },
    })

    // Always return success to prevent email enumeration
    if (!org) {
      return apiMessage('If an account exists with this email, a password reset link has been sent.')
    }

    const user = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email: email.toLowerCase(),
        },
      },
    })

    if (!user || user.deletedAt || user.status === 'INACTIVE') {
      return apiMessage('If an account exists with this email, a password reset link has been sent.')
    }

    // Generate reset token (stored in SystemConfig as a temporary measure)
    // In production, use a dedicated PasswordReset table or Redis
    const resetToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.systemConfig.upsert({
      where: {
        organizationId_key: {
          organizationId: org.id,
          key: `password_reset:${user.id}`,
        },
      },
      update: {
        value: JSON.stringify({ token: resetToken, expiresAt: expiresAt.toISOString() }),
      },
      create: {
        organizationId: org.id,
        key: `password_reset:${user.id}`,
        value: JSON.stringify({ token: resetToken, expiresAt: expiresAt.toISOString() }),
        type: 'json',
      },
    })

    // TODO: Send email with reset link
    // For dev, log the token
    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`)
    console.log(`[DEV] Reset URL: /reset-password?token=${resetToken}&userId=${user.id}&org=${orgSlug}`)

    return apiMessage('If an account exists with this email, a password reset link has been sent.')
  } catch (error) {
    return handleRouteError(error)
  }
}
