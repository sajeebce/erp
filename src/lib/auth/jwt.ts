import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET || 'ngo-erp-access-secret-change-in-production'
)
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.REFRESH_TOKEN_SECRET || 'ngo-erp-refresh-secret-change-in-production'
)
const SUPER_ADMIN_TOKEN_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_TOKEN_SECRET || 'ngo-erp-super-admin-secret-change-in-production'
)

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const SUPER_ADMIN_TOKEN_EXPIRY = '8h'

// ─── Token Payloads ───

export interface AccessTokenPayload extends JWTPayload {
  userId: string
  organizationId: string
  roleId: string
  roleName: string
  isImpersonating?: boolean
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string
  organizationId: string
  tokenId: string
}

export interface SuperAdminTokenPayload extends JWTPayload {
  superAdminId: string
  email: string
  isSuperAdmin: true
}

// ─── Sign Tokens ───

export async function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET)
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET)
}

export async function signSuperAdminToken(payload: Omit<SuperAdminTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SUPER_ADMIN_TOKEN_EXPIRY)
    .sign(SUPER_ADMIN_TOKEN_SECRET)
}

// ─── Verify Tokens ───

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET)
    return payload as AccessTokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET)
    return payload as RefreshTokenPayload
  } catch {
    return null
  }
}

export async function verifySuperAdminToken(token: string): Promise<SuperAdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SUPER_ADMIN_TOKEN_SECRET)
    return payload as SuperAdminTokenPayload
  } catch {
    return null
  }
}

// ─── Extract Token from Request ───

export function extractTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try cookie
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/accessToken=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

export function extractRefreshTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/refreshToken=([^;]+)/)
    if (match) return match[1]
  }

  // Also check body for API clients
  return null
}
