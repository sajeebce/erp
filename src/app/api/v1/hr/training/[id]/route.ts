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
    await requireAuthFromRequest(request)
    const { id } = await params

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            employee: {
              select: { id: true, employeeNo: true, fullName: true },
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

    const existing = await prisma.training.findUnique({ where: { id } })
    if (!existing) {
      return apiNotFound('Training not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title.trim()
    if (body.type !== undefined) data.type = body.type
    if (body.facilitator !== undefined) data.facilitator = body.facilitator || null
    if (body.venue !== undefined) data.venue = body.venue || null
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.durationHours !== undefined) data.durationHours = body.durationHours
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
