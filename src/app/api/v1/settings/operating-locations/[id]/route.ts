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

    const location = await prisma.operatingLocation.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        businessUnit: { select: { id: true, code: true, name: true, shortName: true } },
      },
    })
    if (!location) return apiNotFound('Operating location not found')

    return apiSuccess(location)
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

    const existing = await prisma.operatingLocation.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) return apiNotFound('Operating location not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiBadRequest('name cannot be empty')
      data.name = body.name.trim()
    }
    if (body.code !== undefined) {
      const trimmed = body.code.trim()
      if (trimmed !== existing.code) {
        const conflict = await prisma.operatingLocation.findUnique({
          where: { organizationId_code: { organizationId: auth.organizationId, code: trimmed } },
        })
        if (conflict) return apiConflict(`Location code "${trimmed}" already exists`)
      }
      data.code = trimmed
    }
    if (body.businessUnitId !== undefined) {
      if (body.businessUnitId) {
        const bu = await prisma.businessUnit.findFirst({
          where: { id: body.businessUnitId, organizationId: auth.organizationId },
        })
        if (!bu) return apiNotFound('Business unit not found in this organization')
      }
      data.businessUnitId = body.businessUnitId ?? null
    }
    if (body.address !== undefined) data.address = body.address?.trim() ?? null
    if (body.localizedName !== undefined) data.localizedName = body.localizedName
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields to update')

    const updated = await prisma.operatingLocation.update({
      where: { id },
      data,
      include: {
        businessUnit: { select: { id: true, code: true, name: true, shortName: true } },
      },
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

    const location = await prisma.operatingLocation.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!location) return apiNotFound('Operating location not found')

    await prisma.operatingLocation.delete({ where: { id } })
    return apiSuccess({ message: 'Operating location deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
