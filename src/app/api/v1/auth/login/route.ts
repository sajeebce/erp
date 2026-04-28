import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiUnauthorized, handleRouteError } from '@/lib/api-response'

function isLocalDevRequest(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') return false

  const hostname = request.nextUrl.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const orgSlug = typeof body.orgSlug === 'string' ? body.orgSlug.trim().toLowerCase() : ''

    if (!email || !password || !orgSlug) {
      return apiBadRequest('Email, password, and organization slug are required')
    }

    // 1. Resolve organization
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: orgSlug },
          { customDomain: orgSlug },
        ],
        isActive: true,
      },
    })

    if (!organization) {
      return apiUnauthorized('Organization not found')
    }

    // 2. Find user in this org
    const user = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email,
        },
      },
      include: { role: true },
    })

    if (!user || user.deletedAt) {
      return apiUnauthorized('Invalid email or password')
    }

    // 3. Check account status
    const skipLockout = isLocalDevRequest(request)

    if (user.status === 'LOCKED') {
      if (skipLockout) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE', failedLoginCount: 0, lockedUntil: null },
        })
      } else if (user.lockedUntil && user.lockedUntil > new Date()) {
        return apiUnauthorized('Account is locked. Try again later.')
      } else {
        // Auto-unlock if lock period has passed
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE', failedLoginCount: 0, lockedUntil: null },
        })
      }
    }

    if (user.status === 'INACTIVE') {
      return apiUnauthorized('Account is inactive. Contact your administrator.')
    }

    // 4. Verify password
    if (!verifyPassword(password, user.passwordHash)) {
      if (!skipLockout) {
        const failedCount = user.failedLoginCount + 1
        const updateData: Record<string, unknown> = { failedLoginCount: failedCount }

        // Lock after 5 failed attempts for 15 minutes
        if (failedCount >= 5) {
          updateData.status = 'LOCKED'
          updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        }

        await prisma.user.update({ where: { id: user.id }, data: updateData })
      }
      return apiUnauthorized('Invalid email or password')
    }

    // 5. Reset failed count on success
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    })

    // 6. Create refresh token in DB
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // 7. Sign JWT tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      organizationId: organization.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })

    const refreshToken = await signRefreshToken({
      userId: user.id,
      organizationId: organization.id,
      tokenId: refreshTokenRecord.id,
    })

    // 8. Update refresh token with signed JWT
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    })

    // 9. Set cookies
    const response = apiSuccess({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        organizationId: organization.id,
        organizationName: organization.name,
      },
    })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Set locale cookie based on user preference or org default
    const locale = user.preferredLanguage || organization.defaultLanguage || 'en'
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
    })

    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
