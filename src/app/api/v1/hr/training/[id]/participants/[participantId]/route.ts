import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiMessage,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; participantId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, participantId } = await params
    const body = await request.json()

    const participant = await prisma.trainingParticipant.findFirst({
      where: {
        id: participantId,
        trainingId: id,
        training: { organizationId: auth.organizationId },
        employee: { organizationId: auth.organizationId, deletedAt: null },
      },
      include: {
        employee: { select: { fullName: true } },
        training: { select: { title: true } },
      },
    })
    if (!participant) return apiNotFound('Training participant not found')

    const data: Record<string, unknown> = {}
    if (body.attended !== undefined) data.attended = Boolean(body.attended)
    if (body.score !== undefined) {
      data.score = body.score === '' || body.score === null ? null : new Prisma.Decimal(body.score)
    }
    if (body.feedback !== undefined) data.feedback = body.feedback || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.trainingParticipant.update({
      where: { id: participantId },
      data,
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
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'training_participant',
      resourceId: participantId,
      description: `Updated "${participant.employee.fullName}" participation for training "${participant.training.title}"`,
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
    const { id, participantId } = await params

    const participant = await prisma.trainingParticipant.findFirst({
      where: {
        id: participantId,
        trainingId: id,
        training: { organizationId: auth.organizationId },
        employee: { organizationId: auth.organizationId, deletedAt: null },
      },
      include: {
        employee: { select: { fullName: true } },
        training: { select: { title: true } },
      },
    })
    if (!participant) return apiNotFound('Training participant not found')

    await prisma.trainingParticipant.delete({ where: { id: participantId } })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'training_participant',
      resourceId: participantId,
      description: `Removed "${participant.employee.fullName}" from training "${participant.training.title}"`,
      oldValues: { trainingId: id, employeeId: participant.employeeId },
      ...auditCtx,
    })

    return apiMessage('Participant removed successfully')
  } catch (error) {
    return handleRouteError(error)
  }
}
