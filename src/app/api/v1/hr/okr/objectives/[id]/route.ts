import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const objective = await prisma.oKRObjective.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        cycle: { select: { id: true, name: true, status: true } },
        parentObjective: { select: { id: true, title: true } },
        childObjectives: {
          select: { id: true, title: true, ownerType: true, progress: true, status: true },
        },
        keyResults: {
          include: {
            checkIns: {
              orderBy: { checkInDate: 'desc' },
            },
          },
        },
        scores: true,
      },
    })

    if (!objective) {
      return apiNotFound('OKR objective not found')
    }

    return apiSuccess(objective)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.oKRObjective.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('OKR objective not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description || null
    if (body.weight !== undefined) data.weight = new Prisma.Decimal(body.weight)
    if (body.status !== undefined) data.status = body.status
    if (body.ownerType !== undefined) data.ownerType = body.ownerType
    if (body.ownerId !== undefined) data.ownerId = body.ownerId
    if (body.parentObjectiveId !== undefined) data.parentObjectiveId = body.parentObjectiveId || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.oKRObjective.update({
      where: { id },
      data,
      include: { keyResults: true },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'okr_objective',
      resourceId: id,
      description: `Updated OKR objective "${existing.title}"`,
      oldValues: { status: existing.status, title: existing.title },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.oKRObjective.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('OKR objective not found')
    }

    if (existing.status === 'CANCELLED') {
      return apiBadRequest('Objective is already cancelled')
    }

    const updated = await prisma.oKRObjective.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'okr_objective',
      resourceId: id,
      description: `Cancelled OKR objective "${existing.title}"`,
      oldValues: { status: existing.status },
      newValues: { status: 'CANCELLED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
