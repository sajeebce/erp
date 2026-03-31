import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; contactId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, contactId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeEmergencyContact.findFirst({
      where: { id: contactId, employeeId },
    })
    if (!existing) return apiNotFound('Emergency contact not found')

    const body = await request.json()

    if (body.isPrimary) {
      await prisma.employeeEmergencyContact.updateMany({
        where: { employeeId, id: { not: contactId } },
        data: { isPrimary: false },
      })
    }

    const updated = await prisma.employeeEmergencyContact.update({
      where: { id: contactId },
      data: {
        ...(body.contactName !== undefined && { contactName: body.contactName.trim() }),
        ...(body.relationship !== undefined && { relationship: body.relationship.trim() }),
        ...(body.phone !== undefined && { phone: body.phone.trim() }),
        ...(body.alternatePhone !== undefined && { alternatePhone: body.alternatePhone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
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
    const { id: employeeId, contactId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeEmergencyContact.findFirst({
      where: { id: contactId, employeeId },
    })
    if (!existing) return apiNotFound('Emergency contact not found')

    await prisma.employeeEmergencyContact.delete({ where: { id: contactId } })

    return apiSuccess({ message: 'Emergency contact deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
