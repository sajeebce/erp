import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; historyId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, historyId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeWorkHistory.findFirst({
      where: { id: historyId, employeeId },
    })
    if (!existing) return apiNotFound('Work history record not found')

    const body = await request.json()

    const updated = await prisma.employeeWorkHistory.update({
      where: { id: historyId },
      data: {
        ...(body.employer !== undefined && { employer: body.employer.trim() }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle.trim() }),
        ...(body.department !== undefined && { department: body.department || null }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.reasonForLeaving !== undefined && { reasonForLeaving: body.reasonForLeaving || null }),
        ...(body.responsibilities !== undefined && { responsibilities: body.responsibilities || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.isCurrent !== undefined && { isCurrent: body.isCurrent }),
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, historyId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeWorkHistory.findFirst({
      where: { id: historyId, employeeId },
    })
    if (!existing) return apiNotFound('Work history record not found')

    await prisma.employeeWorkHistory.delete({ where: { id: historyId } })

    return apiSuccess({ message: 'Work history record deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
