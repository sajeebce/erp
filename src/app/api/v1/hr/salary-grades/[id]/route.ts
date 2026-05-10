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
    const parsedLevel = level !== undefined ? Number(level) : undefined
    const parsedMinSalary = minSalary !== undefined ? Number(minSalary) : undefined
    const parsedMidSalary = midSalary !== undefined ? Number(midSalary) : undefined
    const parsedMaxSalary = maxSalary !== undefined ? Number(maxSalary) : undefined
    const stepEffectiveFrom = effectiveFrom || existing.effectiveFrom.toISOString()
    const cleanedSteps = Array.isArray(steps)
      ? steps.map((step: { stepNumber: number | string; basicSalary: number | string; effectiveFrom?: string }) => ({
          stepNumber: Number(step.stepNumber),
          basicSalary: Number(step.basicSalary),
          effectiveFrom: step.effectiveFrom || stepEffectiveFrom,
        }))
      : undefined

    if (parsedLevel !== undefined && (!Number.isInteger(parsedLevel) || parsedLevel < 1)) {
      return apiBadRequest('Salary grade level is invalid')
    }
    if (
      [parsedMinSalary, parsedMidSalary, parsedMaxSalary].some((value) => value !== undefined && (!Number.isFinite(value) || value <= 0))
    ) {
      return apiBadRequest('Salary grade salary range is invalid')
    }
    const nextMin = parsedMinSalary ?? Number(existing.minSalary)
    const nextMid = parsedMidSalary ?? Number(existing.midSalary)
    const nextMax = parsedMaxSalary ?? Number(existing.maxSalary)
    if (nextMin > nextMid || nextMid > nextMax) {
      return apiBadRequest('Salary range must be ordered as minimum, midpoint, maximum')
    }
    if (
      cleanedSteps &&
      (cleanedSteps.some((step) => !Number.isInteger(step.stepNumber) || step.stepNumber < 1 || !Number.isFinite(step.basicSalary) || step.basicSalary <= 0) ||
        new Set(cleanedSteps.map((step) => step.stepNumber)).size !== cleanedSteps.length)
    ) {
      return apiBadRequest('Salary grade steps are invalid')
    }

    const grade = await prisma.$transaction(async (tx) => {
      // If steps provided, delete existing and recreate
      if (cleanedSteps) {
        await tx.salaryGradeStep.deleteMany({ where: { gradeId: id } })
        if (cleanedSteps.length > 0) {
          await tx.salaryGradeStep.createMany({
            data: cleanedSteps.map((s) => ({
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
          ...(parsedLevel !== undefined && { level: parsedLevel }),
          ...(description !== undefined && { description }),
          ...(parsedMinSalary !== undefined && { minSalary: parsedMinSalary }),
          ...(parsedMidSalary !== undefined && { midSalary: parsedMidSalary }),
          ...(parsedMaxSalary !== undefined && { maxSalary: parsedMaxSalary }),
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.salaryGrade.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Salary grade not found')
    }

    const isActive = body.isActive !== undefined
      ? Boolean(body.isActive)
      : body.status
        ? String(body.status).toUpperCase() === 'ACTIVE'
        : undefined

    if (isActive === undefined) {
      return apiBadRequest('isActive or status is required')
    }

    const grade = await prisma.salaryGrade.update({
      where: { id },
      data: { isActive },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_grade',
      resourceId: id,
      description: `${isActive ? 'Activated' : 'Deactivated'} salary grade ${existing.code} - ${existing.name}`,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive },
      ...auditCtx,
    })

    return apiSuccess({
      ...grade,
      status: grade.isActive ? 'ACTIVE' : 'INACTIVE',
    })
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
