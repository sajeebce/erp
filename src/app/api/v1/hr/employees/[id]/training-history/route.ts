import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) return apiNotFound('Employee not found')

    const participations = await prisma.trainingParticipant.findMany({
      where: { employeeId, training: { organizationId: auth.organizationId } },
      include: {
        training: {
          select: {
            id: true,
            trainingNo: true,
            title: true,
            type: true,
            facilitator: true,
            venue: true,
            startDate: true,
            endDate: true,
            durationHours: true,
            status: true,
            projectId: true,
          },
        },
      },
      orderBy: { training: { startDate: 'desc' } },
    })

    const projectIds = [
      ...new Set(participations.map((item) => item.training.projectId).filter(Boolean) as string[]),
    ]
    const projects = projectIds.length
      ? await prisma.project.findMany({
          where: { id: { in: projectIds }, organizationId: auth.organizationId, deletedAt: null },
          select: { id: true, projectNo: true, name: true },
        })
      : []
    const projectById = Object.fromEntries(projects.map((project) => [project.id, project]))

    return apiSuccess(
      participations.map((participation) => ({
        id: participation.id,
        attended: participation.attended,
        score: participation.score,
        feedback: participation.feedback,
        training: {
          ...participation.training,
          project: participation.training.projectId ? projectById[participation.training.projectId] ?? null : null,
        },
      }))
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
