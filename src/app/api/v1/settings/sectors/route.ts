import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
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
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActiveParam = searchParams.get('isActive')

    const where: Record<string, unknown> = { organizationId: auth.organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }

    const sectors = await prisma.sector.findMany({
      where,
      include: { _count: { select: { businessUnits: true } } },
      orderBy: { code: 'asc' },
    })

    return apiSuccess(
      sectors.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        localizedName: s.localizedName,
        isActive: s.isActive,
        businessUnitCount: s._count.businessUnits,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const body = await request.json()
    const { code, name, localizedName } = body

    if (!code || !name) {
      return apiBadRequest('code and name are required')
    }

    const existing = await prisma.sector.findUnique({
      where: { organizationId_code: { organizationId: auth.organizationId, code: code.trim() } },
    })
    if (existing) {
      return apiConflict(`Sector code "${code}" already exists`)
    }

    const sector = await prisma.sector.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim(),
        name: name.trim(),
        localizedName: localizedName ?? null,
        isActive: true,
      },
    })

    return apiCreated(sector)
  } catch (error) {
    return handleRouteError(error)
  }
}
