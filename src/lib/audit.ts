import { prisma } from '@/lib/db'
import type { AuditAction } from '@prisma/client'

interface AuditLogParams {
  organizationId: string
  userId?: string
  action: AuditAction
  module: string
  resource: string
  resourceId?: string
  description: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  isImpersonated?: boolean
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.tenantAuditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        module: params.module,
        resource: params.resource,
        resourceId: params.resourceId,
        description: params.description,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        isImpersonated: params.isImpersonated ?? false,
      },
    })
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('Audit log failed:', error)
  }
}

export function getAuditContext(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  }
}
