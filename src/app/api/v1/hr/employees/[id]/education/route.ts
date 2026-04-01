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

    const items = await prisma.employeeEducation.findMany({
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

    if (!body.degree?.trim()) return apiBadRequest('Degree is required')
    if (!body.institution?.trim()) return apiBadRequest('Institution is required')

    const created = await prisma.employeeEducation.create({
      data: {
        employeeId,
        degree: body.degree.trim(),
        institution: body.institution.trim(),
        fieldOfStudy: body.fieldOfStudy || null,
        startYear: body.startYear ?? null,
        endYear: body.endYear ?? null,
        grade: body.grade || null,
        country: body.country || null,
        filePath: body.filePath || null,
      },
    })

    return apiSuccess(created)
  } catch (error) {
    return handleRouteError(error)
  }
}
