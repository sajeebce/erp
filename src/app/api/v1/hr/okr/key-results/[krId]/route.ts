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
  params: Promise<{ krId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { krId } = await params

    const existing = await prisma.oKRKeyResult.findFirst({
      where: {
        id: krId,
        objective: { organizationId: auth.organizationId },
      },
      include: {
        objective: { select: { id: true, title: true, organizationId: true } },
      },
    })

    if (!existing) {
      return apiNotFound('Key result not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description || null
    if (body.resultType !== undefined) {
      const validTypes = ['METRIC', 'MILESTONE', 'PERCENTAGE']
      if (!validTypes.includes(body.resultType)) {
        return apiBadRequest(`resultType must be one of: ${validTypes.join(', ')}`)
      }
      data.resultType = body.resultType
    }
    if (body.startValue !== undefined) data.startValue = new Prisma.Decimal(body.startValue)
    if (body.targetValue !== undefined) data.targetValue = new Prisma.Decimal(body.targetValue)
    if (body.currentValue !== undefined) data.currentValue = new Prisma.Decimal(body.currentValue)
    if (body.unit !== undefined) data.unit = body.unit || null
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.status !== undefined) data.status = body.status

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.oKRKeyResult.update({
      where: { id: krId },
      data,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'okr_key_result',
      resourceId: krId,
      description: `Updated key result "${existing.title}" on objective "${existing.objective.title}"`,
      oldValues: { title: existing.title, status: existing.status },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
