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

    const where = {
      customDomain: { not: null },
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          customDomain: true,
          domainVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ])

    const data = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      customDomain: org.customDomain,
      domainVerified: org.domainVerified,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }))

    return apiPaginated(data, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
