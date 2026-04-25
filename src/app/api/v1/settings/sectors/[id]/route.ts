import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const sector = await prisma.sector.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { businessUnits: { orderBy: { code: 'asc' } } },
    })
    if (!sector) return apiNotFound('Sector not found')

    return apiSuccess(sector)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const existing = await prisma.sector.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) return apiNotFound('Sector not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiBadRequest('name cannot be empty')
      data.name = body.name.trim()
    }
    if (body.code !== undefined) {
      const trimmed = body.code.trim()
      if (trimmed !== existing.code) {
        const conflict = await prisma.sector.findUnique({
          where: { organizationId_code: { organizationId: auth.organizationId, code: trimmed } },
        })
        if (conflict) return apiConflict(`Sector code "${trimmed}" already exists`)
      }
      data.code = trimmed
    }
    if (body.localizedName !== undefined) data.localizedName = body.localizedName
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields to update')

    const updated = await prisma.sector.update({ where: { id }, data })
    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const sector = await prisma.sector.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { _count: { select: { businessUnits: true } } },
    })
    if (!sector) return apiNotFound('Sector not found')

    if (sector._count.businessUnits > 0) {
      return apiConflict(
        `Cannot delete sector with ${sector._count.businessUnits} business unit(s). Deactivate or reassign them first.`
      )
    }

    await prisma.sector.delete({ where: { id } })
    return apiSuccess({ message: 'Sector deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
