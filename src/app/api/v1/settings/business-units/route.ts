import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sectorId = searchParams.get('sectorId')
    const isActiveParam = searchParams.get('isActive')

    const where: Record<string, unknown> = { organizationId: auth.organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (sectorId) where.sectorId = sectorId
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true'

    const units = await prisma.businessUnit.findMany({
      where,
      include: {
        sector: { select: { id: true, code: true, name: true } },
        _count: { select: { costCenters: true } },
      },
      orderBy: { code: 'asc' },
    })

    return apiSuccess(
      units.map(u => ({
        id: u.id,
        code: u.code,
        name: u.name,
        shortName: u.shortName,
        localizedName: u.localizedName,
        isActive: u.isActive,
        sectorId: u.sectorId,
        sector: u.sector,
        costCenterCount: u._count.costCenters,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
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
    const { code, name, shortName, sectorId, localizedName } = body

    if (!code || !name || !sectorId) {
      return apiBadRequest('code, name, and sectorId are required')
    }

    const sector = await prisma.sector.findFirst({
      where: { id: sectorId, organizationId: auth.organizationId },
    })
    if (!sector) return apiNotFound('Sector not found in this organization')

    const existing = await prisma.businessUnit.findUnique({
      where: { organizationId_code: { organizationId: auth.organizationId, code: code.trim() } },
    })
    if (existing) return apiConflict(`Business unit code "${code}" already exists`)

    const unit = await prisma.businessUnit.create({
      data: {
        organizationId: auth.organizationId,
        sectorId,
        code: code.trim(),
        name: name.trim(),
        shortName: shortName?.trim() ?? null,
        localizedName: localizedName ?? null,
        isActive: true,
      },
      include: { sector: { select: { id: true, code: true, name: true } } },
    })

    return apiCreated(unit)
  } catch (error) {
    return handleRouteError(error)
  }
}
