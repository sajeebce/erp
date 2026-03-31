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

    const items = await prisma.employeeSkill.findMany({
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

    if (!body.skillName?.trim()) return apiBadRequest('Skill name is required')
    if (!body.proficiency?.trim()) return apiBadRequest('Proficiency is required')

    const existing = await prisma.employeeSkill.findFirst({
      where: { employeeId, skillName: body.skillName.trim() },
    })
    if (existing) return apiBadRequest('This skill already exists for the employee')

    const created = await prisma.employeeSkill.create({
      data: {
        employeeId,
        skillName: body.skillName.trim(),
        proficiency: body.proficiency.trim(),
        yearsOfExp: body.yearsOfExp ?? null,
      },
    })

    return apiSuccess(created)
  } catch (error) {
    return handleRouteError(error)
  }
}
