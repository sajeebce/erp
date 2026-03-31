import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiNotFound,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params
    const body = await request.json()

    const { newGradeId, newStepNo, effectiveDate, revisionType, reason, remarks } = body

    if (!newGradeId || !newStepNo || !effectiveDate || !revisionType) {
      return apiBadRequest('newGradeId, newStepNo, effectiveDate, and revisionType are required')
    }

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId },
      select: {
        id: true,
        salaryGradeId: true,
        salaryStepNo: true,
        basicSalary: true,
      },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    // Verify new grade belongs to org and get step salary
    const newGrade = await prisma.salaryGrade.findFirst({
      where: { id: newGradeId, organizationId: auth.organizationId, isActive: true },
      include: {
        steps: { where: { stepNumber: newStepNo } },
      },
    })

    if (!newGrade) {
      return apiNotFound('Salary grade not found')
    }

    if (newGrade.steps.length === 0) {
      return apiBadRequest(`Step ${newStepNo} not found in grade ${newGrade.code}`)
    }

    const newBasicSalary = newGrade.steps[0].basicSalary

    // Transactional: create revision history + update employee
    const revision = await prisma.$transaction(async (tx) => {
      const rev = await tx.salaryRevisionHistory.create({
        data: {
          organizationId: auth.organizationId,
          employeeId,
          revisionDate: new Date(),
          effectiveDate: new Date(effectiveDate),
          revisionType,
          previousGradeId: employee.salaryGradeId || null,
          newGradeId,
          previousStepNo: employee.salaryStepNo || null,
          newStepNo,
          previousBasic: employee.basicSalary || null,
          newBasic: newBasicSalary,
          previousGross: employee.basicSalary || null,
          newGross: newBasicSalary,
          reason: reason || null,
          remarks: remarks || null,
        },
        include: {
          previousGrade: { select: { id: true, code: true, name: true } },
          newGrade: { select: { id: true, code: true, name: true } },
        },
      })

      await tx.employee.update({
        where: { id: employeeId },
        data: {
          salaryGradeId: newGradeId,
          salaryStepNo: newStepNo,
          basicSalary: newBasicSalary,
        },
      })

      return rev
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'salary_revision',
      resourceId: revision.id,
      description: `Created salary revision for employee ${employeeId}: ${revisionType}`,
      oldValues: {
        gradeId: employee.salaryGradeId,
        stepNo: employee.salaryStepNo,
        basicSalary: employee.basicSalary?.toString(),
      },
      newValues: {
        gradeId: newGradeId,
        stepNo: newStepNo,
        basicSalary: newBasicSalary.toString(),
      },
      ...auditCtx,
    })

    return apiCreated(revision)
  } catch (error) {
    return handleRouteError(error)
  }
}
