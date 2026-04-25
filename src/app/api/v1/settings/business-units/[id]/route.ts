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

    const unit = await prisma.businessUnit.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        sector: { select: { id: true, code: true, name: true } },
        costCenters: { orderBy: { code: 'asc' } },
        operatingLocations: { orderBy: { code: 'asc' } },
      },
    })
    if (!unit) return apiNotFound('Business unit not found')

    return apiSuccess(unit)
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

    const existing = await prisma.businessUnit.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) return apiNotFound('Business unit not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiBadRequest('name cannot be empty')
      data.name = body.name.trim()
    }
    if (body.shortName !== undefined) data.shortName = body.shortName?.trim() ?? null
    if (body.code !== undefined) {
      const trimmed = body.code.trim()
      if (trimmed !== existing.code) {
        const conflict = await prisma.businessUnit.findUnique({
          where: { organizationId_code: { organizationId: auth.organizationId, code: trimmed } },
        })
        if (conflict) return apiConflict(`Business unit code "${trimmed}" already exists`)
      }
      data.code = trimmed
    }
    if (body.sectorId !== undefined) {
      const sector = await prisma.sector.findFirst({
        where: { id: body.sectorId, organizationId: auth.organizationId },
      })
      if (!sector) return apiNotFound('Sector not found in this organization')
      data.sectorId = body.sectorId
    }
    if (body.localizedName !== undefined) data.localizedName = body.localizedName
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields to update')

    const updated = await prisma.businessUnit.update({
      where: { id },
      data,
      include: { sector: { select: { id: true, code: true, name: true } } },
    })
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

    const unit = await prisma.businessUnit.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        _count: {
          select: { costCenters: true, journalLines: true, vouchers: true },
        },
      },
    })
    if (!unit) return apiNotFound('Business unit not found')

    const refCount =
      unit._count.costCenters + unit._count.journalLines + unit._count.vouchers
    if (refCount > 0) {
      return apiConflict(
        `Cannot delete business unit: it has ${unit._count.costCenters} cost center(s) and ${unit._count.journalLines + unit._count.vouchers} transaction reference(s). Deactivate instead.`
      )
    }

    await prisma.businessUnit.delete({ where: { id } })
    return apiSuccess({ message: 'Business unit deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
