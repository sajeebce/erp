import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const features = await prisma.platformFeature.findMany({
      include: {
        _count: { select: { plans: true } },
      },
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })

    const data = features.map((feature) => ({
      id: feature.id,
      code: feature.code,
      name: feature.name,
      description: feature.description,
      module: feature.module,
      isQuantifiable: feature.isQuantifiable,
      defaultLimit: feature.defaultLimit,
      isBeta: feature.isBeta,
      isActive: feature.isActive,
      createdAt: feature.createdAt,
      planCount: feature._count.plans,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const body = await request.json()
    const { code, name, description, module, isQuantifiable, defaultLimit, isBeta } = body

    if (!code || !name) {
      return apiBadRequest('Code and name are required')
    }

    if (typeof code !== 'string' || code.trim().length < 2) {
      return apiBadRequest('Feature code must be at least 2 characters')
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return apiBadRequest('Feature name must be at least 2 characters')
    }

    const existing = await prisma.platformFeature.findUnique({
      where: { code: code.trim() },
    })

    if (existing) {
      return apiConflict('A feature with this code already exists')
    }

    const feature = await prisma.platformFeature.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description || null,
        module: module || null,
        isQuantifiable: isQuantifiable ?? false,
        defaultLimit: defaultLimit ?? null,
        isBeta: isBeta ?? false,
      },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'CREATE_FEATURE',
        entityType: 'PlatformFeature',
        entityId: feature.id,
        details: { code: feature.code, name: feature.name },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiCreated(feature)
  } catch (error) {
    return handleRouteError(error)
  }
}
