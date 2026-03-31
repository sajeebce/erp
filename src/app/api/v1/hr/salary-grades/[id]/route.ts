import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiNotFound,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const grade = await prisma.salaryGrade.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })

    if (!grade) {
      return apiNotFound('Salary grade not found')
    }

    return apiSuccess(grade)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.salaryGrade.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { steps: true },
    })

    if (!existing) {
      return apiNotFound('Salary grade not found')
    }

    const { code, name, level, minSalary, midSalary, maxSalary, currency, effectiveFrom, effectiveTo, description, isActive, steps } = body

    const grade = await prisma.$transaction(async (tx) => {
      // If steps provided, delete existing and recreate
      if (steps && Array.isArray(steps)) {
        await tx.salaryGradeStep.deleteMany({ where: { gradeId: id } })
        if (steps.length > 0) {
          await tx.salaryGradeStep.createMany({
            data: steps.map((s: { stepNumber: number; basicSalary: number; effectiveFrom: string }) => ({
              gradeId: id,
              stepNumber: s.stepNumber,
              basicSalary: s.basicSalary,
              effectiveFrom: new Date(s.effectiveFrom),
            })),
          })
        }
      }

      return tx.salaryGrade.update({
        where: { id },
        data: {
          ...(code !== undefined && { code }),
          ...(name !== undefined && { name }),
          ...(level !== undefined && { level }),
          ...(description !== undefined && { description }),
          ...(minSalary !== undefined && { minSalary }),
          ...(midSalary !== undefined && { midSalary }),
          ...(maxSalary !== undefined && { maxSalary }),
          ...(currency !== undefined && { currency }),
          ...(effectiveFrom !== undefined && { effectiveFrom: new Date(effectiveFrom) }),
          ...(effectiveTo !== undefined && { effectiveTo: effectiveTo ? new Date(effectiveTo) : null }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_grade',
      resourceId: id,
      description: `Updated salary grade ${grade.code} - ${grade.name}`,
      oldValues: { code: existing.code, name: existing.name, level: existing.level },
      newValues: { code: grade.code, name: grade.name, level: grade.level },
      ...auditCtx,
    })

    return apiSuccess(grade)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.salaryGrade.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Salary grade not found')
    }

    const grade = await prisma.salaryGrade.update({
      where: { id },
      data: { isActive: false },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_grade',
      resourceId: id,
      description: `Deactivated salary grade ${existing.code} - ${existing.name}`,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ...auditCtx,
    })

    return apiSuccess(grade)
  } catch (error) {
    return handleRouteError(error)
  }
}
