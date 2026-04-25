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

    const center = await prisma.costCenter.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        businessUnit: {
          select: { id: true, code: true, name: true, shortName: true, sector: { select: { id: true, code: true, name: true } } },
        },
      },
    })
    if (!center) return apiNotFound('Cost center not found')

    return apiSuccess(center)
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

    const existing = await prisma.costCenter.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) return apiNotFound('Cost center not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiBadRequest('name cannot be empty')
      data.name = body.name.trim()
    }
    if (body.code !== undefined) {
      const trimmed = body.code.trim()
      if (trimmed !== existing.code) {
        const conflict = await prisma.costCenter.findUnique({
          where: { organizationId_code: { organizationId: auth.organizationId, code: trimmed } },
        })
        if (conflict) return apiConflict(`Cost center code "${trimmed}" already exists`)
      }
      data.code = trimmed
    }
    if (body.businessUnitId !== undefined) {
      const bu = await prisma.businessUnit.findFirst({
        where: { id: body.businessUnitId, organizationId: auth.organizationId },
      })
      if (!bu) return apiNotFound('Business unit not found in this organization')
      data.businessUnitId = body.businessUnitId
    }
    if (body.description !== undefined) data.description = body.description?.trim() ?? null
    if (body.localizedName !== undefined) data.localizedName = body.localizedName
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields to update')

    const updated = await prisma.costCenter.update({
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

    const center = await prisma.costCenter.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { _count: { select: { journalLines: true, expenseClaimItems: true } } },
    })
    if (!center) return apiNotFound('Cost center not found')

    const refCount = center._count.journalLines + center._count.expenseClaimItems
    if (refCount > 0) {
      return apiConflict(
        `Cannot delete cost center: it has ${refCount} transaction reference(s). Deactivate instead.`
      )
    }

    await prisma.costCenter.delete({ where: { id } })
    return apiSuccess({ message: 'Cost center deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
