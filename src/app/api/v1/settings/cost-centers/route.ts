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
    const businessUnitId = searchParams.get('businessUnitId')
    const sectorId = searchParams.get('sectorId')
    const isActiveParam = searchParams.get('isActive')

    const where: Record<string, unknown> = { organizationId: auth.organizationId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (businessUnitId) where.businessUnitId = businessUnitId
    if (sectorId) where.businessUnit = { sectorId }
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true'

    const centers = await prisma.costCenter.findMany({
      where,
      include: {
        businessUnit: {
          select: { id: true, code: true, name: true, shortName: true, sector: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { code: 'asc' },
    })

    return apiSuccess(centers)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const body = await request.json()
    const { code, name, businessUnitId, description, localizedName } = body

    if (!code || !name || !businessUnitId) {
      return apiBadRequest('code, name, and businessUnitId are required')
    }

    const bu = await prisma.businessUnit.findFirst({
      where: { id: businessUnitId, organizationId: auth.organizationId },
    })
    if (!bu) return apiNotFound('Business unit not found in this organization')

    const existing = await prisma.costCenter.findUnique({
      where: { organizationId_code: { organizationId: auth.organizationId, code: code.trim() } },
    })
    if (existing) return apiConflict(`Cost center code "${code}" already exists`)

    const center = await prisma.costCenter.create({
      data: {
        organizationId: auth.organizationId,
        businessUnitId,
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() ?? null,
        localizedName: localizedName ?? null,
        isActive: true,
      },
      include: {
        businessUnit: { select: { id: true, code: true, name: true, shortName: true } },
      },
    })

    return apiCreated(center)
  } catch (error) {
    return handleRouteError(error)
  }
}
