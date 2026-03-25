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
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const training = await prisma.training.findUnique({
      where: { id },
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
    const training = await prisma.training.findUnique({ where: { id }, select: { id: true, title: true } })
    if (!training) {
      return apiNotFound('Training not found')
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
