import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiPaginated, parsePaginationParams, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const userId = url.searchParams.get('userId') || undefined
    const action = url.searchParams.get('action') || undefined
    const module = url.searchParams.get('module') || undefined
    const resource = url.searchParams.get('resource') || undefined
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (userId) where.userId = userId
    if (action) where.action = action
    if (module) where.module = module
    if (resource) where.resource = resource
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    }

    const [logs, total] = await Promise.all([
      prisma.tenantAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          module: true,
          resource: true,
          resourceId: true,
          description: true,
          ipAddress: true,
          isImpersonated: true,
          status: true,
          createdAt: true,
          user: {
            select: { fullName: true, email: true },
          },
        },
      }),
      prisma.tenantAuditLog.count({ where }),
    ])

    return apiPaginated(logs, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
