import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)
    const status = url.searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: { select: { users: true } },
          subscription: { include: { plan: true } },
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
      localizedName: org.localizedName,
      isActive: org.isActive,
      storageUsedBytes: org.storageUsedBytes.toString(),
      bandwidthUsedBytes: org.bandwidthUsedBytes.toString(),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      userCount: org._count.users,
      subscription: org.subscription
        ? {
            id: org.subscription.id,
            status: org.subscription.status,
            billingCycle: org.subscription.billingCycle,
            currentPeriodStart: org.subscription.currentPeriodStart,
            currentPeriodEnd: org.subscription.currentPeriodEnd,
            plan: {
              id: org.subscription.plan.id,
              name: org.subscription.plan.name,
              storageGb: org.subscription.plan.storageGb,
              maxUsers: org.subscription.plan.maxUsers,
            },
          }
        : null,
    }))

    return apiPaginated(data, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return apiBadRequest('Name and slug are required')
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return apiBadRequest('Name must be at least 2 characters')
    }

    if (!SLUG_REGEX.test(slug)) {
      return apiBadRequest(
        'Slug must be 4-50 characters, lowercase alphanumeric and hyphens only, cannot start or end with a hyphen'
      )
    }

    const existing = await prisma.organization.findUnique({
      where: { slug },
    })

    if (existing) {
      return apiConflict('An organization with this slug already exists')
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
      },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'CREATE_ORGANIZATION',
        entityType: 'Organization',
        entityId: organization.id,
        details: { name: organization.name, slug: organization.slug },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiCreated(organization)
  } catch (error) {
    return handleRouteError(error)
  }
}
