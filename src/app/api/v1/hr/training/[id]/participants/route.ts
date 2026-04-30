import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  apiError,
  handleRouteError,
} from '@/lib/api-response'
import { getTrainingEnd, trainingWindowsOverlap } from '@/lib/hr-training'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const training = await prisma.training.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!training) {
      return apiNotFound('Training not found')
    }

    const participants = await prisma.trainingParticipant.findMany({
      where: { trainingId: id },
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

    return apiSuccess(participants)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const { employeeId } = body

    if (!employeeId) {
      return apiBadRequest('employeeId is required')
    }

    // Validate training exists
    const training = await prisma.training.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: {
        id: true,
        trainingNo: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        capacity: true,
      },
    })
    if (!training) {
      return apiNotFound('Training not found')
    }
    if (training.status === 'COMPLETED') {
      return apiBadRequest('Cannot nominate participant to a completed training')
    }
    if (training.status === 'CANCELLED') {
      return apiBadRequest('Cannot nominate participant to a cancelled training')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    // Check duplicate
    const existing = await prisma.trainingParticipant.findUnique({
      where: { trainingId_employeeId: { trainingId: id, employeeId } },
    })
    if (existing) {
      return apiConflict('Employee is already a participant')
    }

    const targetStart = training.startDate
    const targetEnd = getTrainingEnd(training)

    if (training.capacity !== null) {
      const participantCount = await prisma.trainingParticipant.count({ where: { trainingId: id } })
      if (participantCount >= training.capacity) {
        return apiConflict('Training capacity is full')
      }
    }

    const possibleOverlappingParticipants = await prisma.trainingParticipant.findMany({
      where: {
        employeeId,
        trainingId: { not: id },
        training: {
          organizationId: auth.organizationId,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
          startDate: { lt: targetEnd },
        },
      },
      select: {
        training: {
          select: {
            id: true,
            trainingNo: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { training: { startDate: 'asc' } },
    })

    const overlappingParticipant = possibleOverlappingParticipants.find((participant) => {
      if (!participant.training) return false
      const otherEnd = getTrainingEnd(participant.training)
      return trainingWindowsOverlap(targetStart, targetEnd, participant.training.startDate, otherEnd)
    })

    if (overlappingParticipant?.training) {
      const conflictingTraining = overlappingParticipant.training
      return apiError('CONFLICT', 'Employee has overlapping training nomination', 409, {
        conflictingTrainingId: [conflictingTraining.id],
        conflictingTrainingNo: [conflictingTraining.trainingNo],
        conflictingTrainingTitle: [conflictingTraining.title],
        startDate: [conflictingTraining.startDate.toISOString()],
        endDate: [getTrainingEnd(conflictingTraining).toISOString()],
      })
    }

    const participant = await prisma.trainingParticipant.create({
      data: {
        trainingId: id,
        employeeId,
        attended: body.attended ?? false,
      },
      include: {
        employee: { select: { id: true, employeeNo: true, fullName: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'training_participant',
      resourceId: participant.id,
      description: `Added "${employee.fullName}" to training "${training.title}"`,
      newValues: { trainingId: id, employeeId },
      ...auditCtx,
    })

    return apiCreated(participant)
  } catch (error) {
    return handleRouteError(error)
  }
}
