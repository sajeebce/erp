import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    // Optional filters
    const module = url.searchParams.get('module') || undefined
    const action = url.searchParams.get('action') || undefined

    const where = {
      organizationId: orgId,
      ...(module && { module }),
      ...(action && { action: action as never }),
    }

    const [total, logs] = await Promise.all([
      prisma.tenantAuditLog.count({ where }),
      prisma.tenantAuditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          module: true,
          resource: true,
          resourceId: true,
          description: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const feed = logs.map((log) => ({
      id: log.id,
      user: log.user?.fullName ?? 'System',
      email: log.user?.email ?? null,
      action: log.action,
      module: log.module,
      resource: log.resource,
      resourceId: log.resourceId,
      description: log.description,
      status: log.status,
      createdAt: log.createdAt,
    }))

    return apiPaginated(feed, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
