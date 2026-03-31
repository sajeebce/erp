import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const items = await prisma.employeeDependent.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    })

    return apiSuccess(items)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const body = await request.json()

    if (!body.name?.trim()) return apiBadRequest('Name is required')
    if (!body.relationship?.trim()) return apiBadRequest('Relationship is required')

    const created = await prisma.employeeDependent.create({
      data: {
        employeeId,
        name: body.name.trim(),
        relationship: body.relationship.trim(),
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        nidNumber: body.nidNumber || null,
        occupation: body.occupation || null,
        isNominee: body.isNominee ?? false,
        nomineePercentage: body.nomineePercentage != null ? new Prisma.Decimal(body.nomineePercentage) : null,
        nomineeFor: body.nomineeFor || null,
        isInsuranceBeneficiary: body.isInsuranceBeneficiary ?? false,
      },
    })

    return apiSuccess(created)
  } catch (error) {
    return handleRouteError(error)
  }
}
