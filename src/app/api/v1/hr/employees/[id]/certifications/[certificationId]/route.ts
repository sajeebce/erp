import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; certificationId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, certificationId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeCertification.findFirst({
      where: { id: certificationId, employeeId },
    })
    if (!existing) return apiNotFound('Certification not found')

    const body = await request.json()

    const updated = await prisma.employeeCertification.update({
      where: { id: certificationId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.issuingOrg !== undefined && { issuingOrg: body.issuingOrg.trim() }),
        ...(body.issueDate !== undefined && { issueDate: body.issueDate ? new Date(body.issueDate) : null }),
        ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
        ...(body.certificateNo !== undefined && { certificateNo: body.certificateNo || null }),
        ...(body.filePath !== undefined && { filePath: body.filePath || null }),
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
    const { id: employeeId, certificationId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeCertification.findFirst({
      where: { id: certificationId, employeeId },
    })
    if (!existing) return apiNotFound('Certification not found')

    await prisma.employeeCertification.delete({ where: { id: certificationId } })

    return apiSuccess({ message: 'Certification deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
