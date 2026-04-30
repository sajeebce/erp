import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
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
    const url = new URL(request.url)
    const includeIneligible = url.searchParams.get('includeIneligible') === 'true'

    const training = await prisma.training.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        capacity: true,
        _count: { select: { participants: true } },
      },
    })

    if (!training) return apiNotFound('Training not found')

    const targetStart = training.startDate
    const targetEnd = getTrainingEnd(training)
    const capacityFull = training.capacity !== null && training._count.participants >= training.capacity

    const employees = await prisma.employee.findMany({
      where: {
        organizationId: auth.organizationId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        department: { select: { name: true } },
        trainingParticipations: {
          where: {
            OR: [
              { trainingId: id },
              {
                training: {
                  organizationId: auth.organizationId,
                  status: { in: ['PLANNED', 'IN_PROGRESS'] },
                  startDate: { lt: targetEnd },
                },
              },
            ],
          },
          select: {
            trainingId: true,
            training: {
              select: {
                id: true,
                trainingNo: true,
                title: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { fullName: 'asc' },
      take: 500,
    })

    const result = employees.map((employee) => {
      const duplicate = employee.trainingParticipations.find((p) => p.trainingId === id)
      const overlapping = employee.trainingParticipations.find((p) => {
        if (p.trainingId === id || !p.training) return false
        return trainingWindowsOverlap(
          targetStart,
          targetEnd,
          p.training.startDate,
          getTrainingEnd(p.training)
        )
      })

      let reason: string | null = null
      let reasonLabel: string | null = null
      let conflictingTraining: {
        id: string
        trainingNo: string
        title: string
        startDate: string
        endDate: string
      } | null = null

      if (training.status === 'COMPLETED') {
        reason = 'TRAINING_COMPLETED'
        reasonLabel = 'Training is completed'
      } else if (training.status === 'CANCELLED') {
        reason = 'TRAINING_CANCELLED'
        reasonLabel = 'Training is cancelled'
      } else if (capacityFull) {
        reason = 'CAPACITY_FULL'
        reasonLabel = 'Training capacity is full'
      } else if (duplicate) {
        reason = 'ALREADY_NOMINATED'
        reasonLabel = 'Already nominated in this training'
      } else if (overlapping?.training) {
        reason = 'OVERLAPPING_TRAINING'
        reasonLabel = `Conflict with ${overlapping.training.trainingNo} - ${overlapping.training.title}`
        conflictingTraining = {
          id: overlapping.training.id,
          trainingNo: overlapping.training.trainingNo,
          title: overlapping.training.title,
          startDate: overlapping.training.startDate.toISOString(),
          endDate: getTrainingEnd(overlapping.training).toISOString(),
        }
      }

      return {
        id: employee.id,
        employeeNo: employee.employeeNo,
        fullName: employee.fullName,
        department: employee.department,
        eligible: !reason,
        reason,
        reasonLabel,
        conflictingTraining,
      }
    })

    return apiSuccess(includeIneligible ? result : result.filter((employee) => employee.eligible))
  } catch (error) {
    return handleRouteError(error)
  }
}
