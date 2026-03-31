import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; educationId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, educationId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeEducation.findFirst({
      where: { id: educationId, employeeId },
    })
    if (!existing) return apiNotFound('Education record not found')

    const body = await request.json()

    const updated = await prisma.employeeEducation.update({
      where: { id: educationId },
      data: {
        ...(body.degree !== undefined && { degree: body.degree.trim() }),
        ...(body.institution !== undefined && { institution: body.institution.trim() }),
        ...(body.fieldOfStudy !== undefined && { fieldOfStudy: body.fieldOfStudy || null }),
        ...(body.startYear !== undefined && { startYear: body.startYear ?? null }),
        ...(body.endYear !== undefined && { endYear: body.endYear ?? null }),
        ...(body.grade !== undefined && { grade: body.grade || null }),
        ...(body.country !== undefined && { country: body.country || null }),
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
    const { id: employeeId, educationId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeEducation.findFirst({
      where: { id: educationId, employeeId },
    })
    if (!existing) return apiNotFound('Education record not found')

    await prisma.employeeEducation.delete({ where: { id: educationId } })

    return apiSuccess({ message: 'Education record deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
