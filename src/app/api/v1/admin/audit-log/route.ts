import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiPaginated,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)
    const action = url.searchParams.get('action')
    const superAdminId = url.searchParams.get('superAdminId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (action) {
      where.action = action
    }

    if (superAdminId) {
      where.superAdminId = superAdminId
    }

    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {}
      if (startDate) {
        createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        createdAt.lte = new Date(endDate)
      }
      where.createdAt = createdAt
    }

    const [logs, total] = await Promise.all([
      prisma.superAdminAuditLog.findMany({
        where,
        include: {
          superAdmin: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.superAdminAuditLog.count({ where }),
    ])

    const data = logs.map((log) => ({
      id: log.id,
      superAdminId: log.superAdminId,
      superAdminName: log.superAdmin.fullName,
      superAdminEmail: log.superAdmin.email,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }))

    return apiPaginated(data, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
