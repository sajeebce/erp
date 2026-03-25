// Re-export all auth utilities for convenient imports
// Usage: import { requireRole, getOrganizationId, signAccessToken } from '@/lib/auth'

export {
  signAccessToken,
  signRefreshToken,
  signSuperAdminToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySuperAdminToken,
  extractTokenFromRequest,
  type AccessTokenPayload,
  type RefreshTokenPayload,
  type SuperAdminTokenPayload,
} from './jwt'

export {
  hashPassword,
  verifyPassword,
} from './password'

export {
  validatePassword,
} from './password-policy'

export {
  getSession,
  getCurrentUser,
  getOrganizationId,
  requireRole,
  getSuperAdminSession,
  requireSuperAdmin,
  getAuthFromRequest,
  requireAuthFromRequest,
  requireRoleFromRequest,
  getSuperAdminFromRequest,
  requireSuperAdminFromRequest,
} from './session'
