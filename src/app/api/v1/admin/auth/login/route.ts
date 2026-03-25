import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signSuperAdminToken } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiUnauthorized, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiBadRequest('Email and password are required')
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return apiUnauthorized('Invalid credentials')
    }

    if (!verifyPassword(password, superAdmin.passwordHash)) {
      return apiUnauthorized('Invalid credentials')
    }

    // Update last login
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    })

    // Audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'LOGIN',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    // Sign token
    const token = await signSuperAdminToken({
      superAdminId: superAdmin.id,
      email: superAdmin.email,
      isSuperAdmin: true,
    })

    const response = apiSuccess({
      token,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
      },
    })

    response.cookies.set('superAdminToken', token, {
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
