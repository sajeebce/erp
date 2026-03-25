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
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const activity = await prisma.activity.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        activityNo: true,
        name: true,
        description: true,
        projectId: true,
        responsibleId: true,
        startDate: true,
        endDate: true,
        budget: true,
        actualCost: true,
        progress: true,
        status: true,
        parentId: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        children: {
          select: {
            id: true,
            activityNo: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            budget: true,
            actualCost: true,
            progress: true,
            status: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!activity) {
      return apiNotFound('Activity not found')
    }

    return apiSuccess(activity)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.activity.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        projectId: true,
      },
    })

    if (!existing) {
      return apiNotFound('Activity not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = body.name.trim()
    }

    if (body.description !== undefined) {
      data.description = body.description || null
    }

    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : null
    }

    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? new Date(body.endDate) : null
    }

    if (body.budget !== undefined) {
      data.budget = new Prisma.Decimal(body.budget)
    }

    if (body.responsibleId !== undefined) {
      data.responsibleId = body.responsibleId || null
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress)
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return apiBadRequest('Progress must be a number between 0 and 100')
      }
      data.progress = progress

      // Auto-set status to COMPLETED when progress reaches 100
      if (progress === 100) {
        data.status = 'COMPLETED'
      }
    }

    if (body.status !== undefined) {
      const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.activity.update({
      where: { id },
      data,
      select: {
        id: true,
        activityNo: true,
        name: true,
        description: true,
        projectId: true,
        responsibleId: true,
        startDate: true,
        endDate: true,
        budget: true,
        actualCost: true,
        progress: true,
        status: true,
        parentId: true,
        sortOrder: true,
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
      resource: 'activity',
      resourceId: id,
      description: `Updated activity "${updated.name}"`,
      oldValues: {
        name: existing.name,
        status: existing.status,
        progress: existing.progress,
      },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
