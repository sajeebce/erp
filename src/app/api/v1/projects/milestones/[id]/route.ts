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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const milestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        milestoneNo: true,
        description: true,
        projectId: true,
        targetDate: true,
        actualDate: true,
        deliverable: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!milestone) {
      return apiNotFound('Milestone not found')
    }

    return apiSuccess(milestone)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        description: true,
        status: true,
        projectId: true,
      },
    })

    if (!existing) {
      return apiNotFound('Milestone not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length === 0) {
        return apiBadRequest('Description must be a non-empty string')
      }
      data.description = body.description.trim()
    }

    if (body.targetDate !== undefined) {
      data.targetDate = new Date(body.targetDate)
    }

    if (body.actualDate !== undefined) {
      data.actualDate = body.actualDate ? new Date(body.actualDate) : null
    }

    if (body.deliverable !== undefined) {
      data.deliverable = body.deliverable || null
    }

    if (body.notes !== undefined) {
      data.notes = body.notes || null
    }

    if (body.status !== undefined) {
      const validStatuses = ['ON_TRACK', 'ACHIEVED', 'AT_RISK', 'OVERDUE', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status

      // If status is ACHIEVED and no actualDate provided, set it to now
      if (body.status === 'ACHIEVED' && !body.actualDate && !data.actualDate) {
        data.actualDate = new Date()
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data,
      select: {
        id: true,
        milestoneNo: true,
        description: true,
        projectId: true,
        targetDate: true,
        actualDate: true,
        deliverable: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'project',
      resource: 'milestone',
      resourceId: id,
      description: `Updated milestone "${updated.description}"`,
      oldValues: {
        description: existing.description,
        status: existing.status,
      },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
