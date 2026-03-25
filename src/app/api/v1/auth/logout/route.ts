import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken } from '@/lib/auth'
import { apiMessage, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Revoke refresh token
    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/)
      if (match) {
        const payload = await verifyRefreshToken(match[1])
        if (payload?.tokenId) {
          await prisma.refreshToken.update({
            where: { id: payload.tokenId },
            data: { isRevoked: true, revokedAt: new Date() },
          })
        }
      }
    }

    // Clear cookies
    const response = apiMessage('Logged out successfully')

    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
