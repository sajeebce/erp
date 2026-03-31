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
  params: Promise<{ id: string; skillId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, skillId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeSkill.findFirst({
      where: { id: skillId, employeeId },
    })
    if (!existing) return apiNotFound('Skill not found')

    const body = await request.json()

    if (body.skillName !== undefined && body.skillName.trim() !== existing.skillName) {
      const duplicate = await prisma.employeeSkill.findFirst({
        where: { employeeId, skillName: body.skillName.trim(), id: { not: skillId } },
      })
      if (duplicate) return apiBadRequest('This skill already exists for the employee')
    }

    const updated = await prisma.employeeSkill.update({
      where: { id: skillId },
      data: {
        ...(body.skillName !== undefined && { skillName: body.skillName.trim() }),
        ...(body.proficiency !== undefined && { proficiency: body.proficiency.trim() }),
        ...(body.yearsOfExp !== undefined && { yearsOfExp: body.yearsOfExp ?? null }),
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
    const { id: employeeId, skillId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeSkill.findFirst({
      where: { id: skillId, employeeId },
    })
    if (!existing) return apiNotFound('Skill not found')

    await prisma.employeeSkill.delete({ where: { id: skillId } })

    return apiSuccess({ message: 'Skill deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
