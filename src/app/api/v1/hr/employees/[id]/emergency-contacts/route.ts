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

    const items = await prisma.employeeEmergencyContact.findMany({
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

    if (!body.contactName?.trim()) return apiBadRequest('Contact name is required')
    if (!body.relationship?.trim()) return apiBadRequest('Relationship is required')
    if (!body.phone?.trim()) return apiBadRequest('Phone is required')

    if (body.isPrimary) {
      await prisma.employeeEmergencyContact.updateMany({
        where: { employeeId },
        data: { isPrimary: false },
      })
    }

    const created = await prisma.employeeEmergencyContact.create({
      data: {
        employeeId,
        contactName: body.contactName.trim(),
        relationship: body.relationship.trim(),
        phone: body.phone.trim(),
        alternatePhone: body.alternatePhone || null,
        email: body.email || null,
        address: body.address || null,
        isPrimary: body.isPrimary ?? false,
      },
    })

    return apiSuccess(created)
  } catch (error) {
    return handleRouteError(error)
  }
}
