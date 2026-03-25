import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const categories = await prisma.assetCategory.findMany({
      where: { organizationId: auth.organizationId },
      select: {
        id: true,
        code: true,
        name: true,
        usefulLifeYears: true,
        depreciationMethod: true,
        depreciationRate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(categories)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { code, name, usefulLifeYears, depreciationMethod, depreciationRate } = body

    if (!code || !name) {
      return apiBadRequest('code and name are required')
    }

    if (!usefulLifeYears || usefulLifeYears < 1) {
      return apiBadRequest('usefulLifeYears must be at least 1')
    }

    // Check unique code within org
    const existing = await prisma.assetCategory.findFirst({
      where: { organizationId: auth.organizationId, code },
    })
    if (existing) {
      return apiConflict(`Category code "${code}" already exists`)
    }

    const category = await prisma.assetCategory.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim(),
        name: name.trim(),
        usefulLifeYears,
        depreciationMethod: depreciationMethod || 'STRAIGHT_LINE',
        depreciationRate: depreciationRate ?? 0,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset_category',
      resourceId: category.id,
      description: `Created asset category "${name}" (${code})`,
      newValues: { code, name, depreciationMethod: depreciationMethod || 'STRAIGHT_LINE' },
      ...auditCtx,
    })

    return apiCreated(category)
  } catch (error) {
    return handleRouteError(error)
  }
}
