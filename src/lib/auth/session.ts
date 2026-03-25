import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import {
  verifyAccessToken,
  verifySuperAdminToken,
  type AccessTokenPayload,
  type SuperAdminTokenPayload,
} from './jwt'

// ─── Server Component / Server Action Helpers ───

export async function getSession(): Promise<AccessTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) return null
  return verifyAccessToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      role: true,
      department: true,
      organization: true,
    },
  })

  return user
}

export async function getOrganizationId(): Promise<string> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized: No active session')
  }
  return session.organizationId
}

export async function requireRole(allowedRoles: string | string[]): Promise<AccessTokenPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized: No active session')
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  // Org admin (ADMIN role) has access to everything within their org
  if (session.roleName === 'ADMIN') {
    return session
  }

  if (!roles.includes(session.roleName)) {
    throw new Error(`Forbidden: Requires one of [${roles.join(', ')}]`)
  }

  return session
}

// ─── Super Admin Session ───

export async function getSuperAdminSession(): Promise<SuperAdminTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('superAdminToken')?.value
  if (!token) return null
  return verifySuperAdminToken(token)
}

export async function requireSuperAdmin(): Promise<SuperAdminTokenPayload> {
  const session = await getSuperAdminSession()
  if (!session || !session.isSuperAdmin) {
    throw new Error('Unauthorized: Super Admin access required')
  }
  return session
}

// ─── API Route Helpers (from Request object) ───

export async function getAuthFromRequest(request: Request): Promise<AccessTokenPayload | null> {
  // Try Authorization header
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifyAccessToken(authHeader.slice(7))
  }

  // Try cookie
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/accessToken=([^;]+)/)
    if (match) {
      return verifyAccessToken(match[1])
    }
  }

  return null
}

export async function requireAuthFromRequest(request: Request): Promise<AccessTokenPayload> {
  const auth = await getAuthFromRequest(request)
  if (!auth) {
    throw new Error('Unauthorized: Invalid or missing access token')
  }
  return auth
}

export async function requireRoleFromRequest(
  request: Request,
  allowedRoles: string | string[]
): Promise<AccessTokenPayload> {
  const auth = await requireAuthFromRequest(request)
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (auth.roleName === 'ADMIN') return auth
  if (!roles.includes(auth.roleName)) {
    throw new Error(`Forbidden: Requires one of [${roles.join(', ')}]`)
  }

  return auth
}

export async function getSuperAdminFromRequest(request: Request): Promise<SuperAdminTokenPayload | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifySuperAdminToken(authHeader.slice(7))
  }

  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/superAdminToken=([^;]+)/)
    if (match) {
      return verifySuperAdminToken(match[1])
    }
  }

  return null
}

export async function requireSuperAdminFromRequest(request: Request): Promise<SuperAdminTokenPayload> {
  const session = await getSuperAdminFromRequest(request)
  if (!session || !session.isSuperAdmin) {
    throw new Error('Unauthorized: Super Admin access required')
  }
  return session
}
