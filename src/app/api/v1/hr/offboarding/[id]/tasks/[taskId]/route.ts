import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id, taskId } = await params

    // Validate offboarding belongs to org
    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!offboarding) {
      return apiNotFound('Offboarding not found')
    }

    const task = await prisma.offboardingTask.findFirst({
      where: { id: taskId, offboardingId: id },
    })
    if (!task) {
      return apiNotFound('Task not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.isCompleted !== undefined) {
      data.isCompleted = body.isCompleted
      if (body.isCompleted) {
        data.completedAt = new Date()
        data.completedById = auth.userId
      } else {
        data.completedAt = null
        data.completedById = null
      }
    }

    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.offboardingTask.update({
      where: { id: taskId },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
