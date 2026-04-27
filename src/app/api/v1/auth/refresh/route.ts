import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, signAccessToken } from '@/lib/auth'
import { apiSuccess, apiUnauthorized, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // 1. Extract refresh token from cookie or body
    let token: string | null = null

    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/)
      if (match) token = match[1]
    }

    if (!token) {
      const body = await request.json().catch(() => ({}))
      token = body.refreshToken || null
    }

    if (!token) {
      return apiUnauthorized('Refresh token required')
    }

    // 2. Verify JWT
    const payload = await verifyRefreshToken(token)
    if (!payload) {
      return apiUnauthorized('Invalid or expired refresh token')
    }

    // 3. Check DB record
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        id: payload.tokenId,
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { role: true } },
      },
    })

    if (!tokenRecord || !tokenRecord.user) {
      return apiUnauthorized('Refresh token has been revoked or expired')
    }

    if (tokenRecord.user.status !== 'ACTIVE') {
      return apiUnauthorized('Account is not active')
    }

    // 4. Update last used
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    })

    // 5. Sign new access token
    const accessToken = await signAccessToken({
      userId: tokenRecord.user.id,
      organizationId: payload.organizationId,
      roleId: tokenRecord.user.roleId,
      roleName: tokenRecord.user.role.name,
    })

    // 6. Set cookie and return
    const response = apiSuccess({ accessToken })

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })

    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
