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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const { steps } = body

    if (!Array.isArray(steps) || steps.length === 0) {
      return apiBadRequest('steps array is required and must not be empty')
    }

    // Verify grade belongs to org
    const grade = await prisma.salaryGrade.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!grade) {
      return apiNotFound('Salary grade not found')
    }

    const cleanedSteps = steps.map((step: { stepNumber: number | string; basicSalary: number | string; effectiveFrom?: string }) => ({
      stepNumber: Number(step.stepNumber),
      basicSalary: Number(step.basicSalary),
      effectiveFrom: step.effectiveFrom || grade.effectiveFrom.toISOString(),
    }))

    if (
      cleanedSteps.some((step) => !Number.isInteger(step.stepNumber) || step.stepNumber < 1 || !Number.isFinite(step.basicSalary) || step.basicSalary <= 0) ||
      new Set(cleanedSteps.map((step) => step.stepNumber)).size !== cleanedSteps.length
    ) {
      return apiBadRequest('Salary grade steps are invalid')
    }

    // Transactional: delete existing steps and recreate
    const result = await prisma.$transaction(async (tx) => {
      await tx.salaryGradeStep.deleteMany({ where: { gradeId: id } })

      await tx.salaryGradeStep.createMany({
        data: cleanedSteps.map((s) => ({
          gradeId: id,
          stepNumber: s.stepNumber,
          basicSalary: s.basicSalary,
          effectiveFrom: new Date(s.effectiveFrom),
        })),
      })

      return tx.salaryGradeStep.findMany({
        where: { gradeId: id },
        orderBy: { stepNumber: 'asc' },
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_grade_steps',
      resourceId: id,
      description: `Bulk upserted ${steps.length} steps for grade ${grade.code}`,
      newValues: { stepCount: steps.length },
      ...auditCtx,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
