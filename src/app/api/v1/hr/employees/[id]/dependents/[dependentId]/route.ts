import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string; dependentId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, dependentId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeDependent.findFirst({
      where: { id: dependentId, employeeId },
    })
    if (!existing) return apiNotFound('Dependent not found')

    const body = await request.json()

    const updated = await prisma.employeeDependent.update({
      where: { id: dependentId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.relationship !== undefined && { relationship: body.relationship.trim() }),
        ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
        ...(body.gender !== undefined && { gender: body.gender || null }),
        ...(body.nidNumber !== undefined && { nidNumber: body.nidNumber || null }),
        ...(body.occupation !== undefined && { occupation: body.occupation || null }),
        ...(body.isNominee !== undefined && { isNominee: body.isNominee }),
        ...(body.nomineePercentage !== undefined && { nomineePercentage: body.nomineePercentage != null ? new Prisma.Decimal(body.nomineePercentage) : null }),
        ...(body.nomineeFor !== undefined && { nomineeFor: body.nomineeFor || null }),
        ...(body.isInsuranceBeneficiary !== undefined && { isInsuranceBeneficiary: body.isInsuranceBeneficiary }),
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
    const { id: employeeId, dependentId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeDependent.findFirst({
      where: { id: dependentId, employeeId },
    })
    if (!existing) return apiNotFound('Dependent not found')

    await prisma.employeeDependent.delete({ where: { id: dependentId } })

    return apiSuccess({ message: 'Dependent deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}

export { PATCH as PUT }
