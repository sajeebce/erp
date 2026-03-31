import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_STATUS_TRANSITIONS: Record<string, string> = {
  PLANNING: 'ACTIVE',
  ACTIVE: 'SCORING',
  SCORING: 'CLOSED',
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const cycle = await prisma.oKRCycle.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        objectives: {
          include: {
            keyResults: true,
            childObjectives: {
              include: { keyResults: true },
            },
          },
          where: { parentObjectiveId: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!cycle) {
      return apiNotFound('OKR cycle not found')
    }

    // Group objectives by ownerType
    const grouped = {
      ...cycle,
      objectivesByOwnerType: {
        ORGANIZATION: cycle.objectives.filter((o) => o.ownerType === 'ORGANIZATION'),
        DEPARTMENT: cycle.objectives.filter((o) => o.ownerType === 'DEPARTMENT'),
        TEAM: cycle.objectives.filter((o) => o.ownerType === 'TEAM'),
        INDIVIDUAL: cycle.objectives.filter((o) => o.ownerType === 'INDIVIDUAL'),
      },
    }

    return apiSuccess(grouped)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.oKRCycle.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('OKR cycle not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    // Status transition validation
    if (body.status) {
      const allowedNext = VALID_STATUS_TRANSITIONS[existing.status]
      if (body.status !== allowedNext) {
        return apiBadRequest(
          `Invalid status transition: ${existing.status} can only transition to ${allowedNext}`
        )
      }
      data.status = body.status
    }

    if (body.name !== undefined) data.name = body.name
    if (body.cycleType !== undefined) data.cycleType = body.cycleType
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) data.endDate = new Date(body.endDate)
    if (body.checkInFrequency !== undefined) data.checkInFrequency = body.checkInFrequency

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.oKRCycle.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'okr_cycle',
      resourceId: id,
      description: `Updated OKR cycle "${existing.name}"${body.status ? ` status: ${existing.status} → ${body.status}` : ''}`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
