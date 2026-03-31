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

    const items = await prisma.employeeLanguage.findMany({
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

    if (!body.language?.trim()) return apiBadRequest('Language is required')

    const existing = await prisma.employeeLanguage.findFirst({
      where: { employeeId, language: body.language.trim() },
    })
    if (existing) return apiBadRequest('This language already exists for the employee')

    const created = await prisma.employeeLanguage.create({
      data: {
        employeeId,
        language: body.language.trim(),
        readLevel: body.readLevel || null,
        writeLevel: body.writeLevel || null,
        speakLevel: body.speakLevel || null,
      },
    })

    return apiSuccess(created)
  } catch (error) {
    return handleRouteError(error)
  }
}
