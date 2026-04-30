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
import { isInvalidDate } from '@/lib/hr-training'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const training = await prisma.training.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                employeeNo: true,
                fullName: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!training) {
      return apiNotFound('Training not found')
    }

    return apiSuccess(training)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.training.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Training not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title.trim()
    if (body.type !== undefined) {
      const validTypes = ['INTERNAL', 'EXTERNAL', 'ONLINE']
      if (!validTypes.includes(body.type)) {
        return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
      }
      data.type = body.type
    }
    if (body.facilitator !== undefined) data.facilitator = body.facilitator || null
    if (body.venue !== undefined) data.venue = body.venue || null
    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate)
      if (isInvalidDate(startDate)) return apiBadRequest('Invalid startDate')
      data.startDate = startDate
    }
    if (body.endDate !== undefined) {
      const endDate = body.endDate ? new Date(body.endDate) : null
      if (endDate && isInvalidDate(endDate)) return apiBadRequest('Invalid endDate')
      data.endDate = endDate
    }
    const nextStart = (data.startDate as Date | undefined) ?? existing.startDate
    const nextEnd = data.endDate !== undefined ? data.endDate as Date | null : existing.endDate
    if (nextEnd && nextEnd <= nextStart) {
      return apiBadRequest('endDate must be after startDate')
    }
    if (body.durationHours !== undefined) data.durationHours = body.durationHours ? Number(body.durationHours) : null
    if (body.capacity !== undefined) {
      const capacity = body.capacity === '' || body.capacity === null ? null : Number(body.capacity)
      if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
        return apiBadRequest('capacity must be a positive whole number')
      }
      if (capacity !== null) {
        const currentParticipants = await prisma.trainingParticipant.count({ where: { trainingId: id } })
        if (capacity < currentParticipants) {
          return apiBadRequest('capacity cannot be lower than current participant count')
        }
      }
      data.capacity = capacity
    }
    if (body.budget !== undefined) data.budget = new Prisma.Decimal(body.budget)
    if (body.actualCost !== undefined) data.actualCost = new Prisma.Decimal(body.actualCost)
    if (body.status !== undefined) {
      const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
      }
      data.status = body.status
    }
    if (body.description !== undefined) data.description = body.description || null
    if (body.projectId !== undefined) {
      if (body.projectId) {
        const project = await prisma.project.findFirst({
          where: { id: body.projectId, organizationId: auth.organizationId, deletedAt: null },
          select: { id: true },
        })
        if (!project) return apiBadRequest('Project not found in this organization')
      }
      data.projectId = body.projectId || null
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.training.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'training',
      resourceId: id,
      description: `Updated training "${updated.title}"`,
      oldValues: { status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
