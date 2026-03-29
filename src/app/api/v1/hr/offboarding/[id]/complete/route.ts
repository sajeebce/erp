import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

const SEPARATION_TO_STATUS: Record<string, string> = {
  RESIGNATION: 'RESIGNED',
  TERMINATION: 'TERMINATED',
  RETIREMENT: 'RETIRED',
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        tasks: true,
        employee: { select: { id: true, fullName: true, status: true } },
      },
    })
    if (!offboarding) {
      return apiNotFound('Offboarding not found')
    }

    if (offboarding.status === 'COMPLETED') {
      return apiBadRequest('Offboarding is already completed')
    }

    // Validate all tasks are completed
    const incompleteTasks = offboarding.tasks.filter((t) => !t.isCompleted)
    if (incompleteTasks.length > 0) {
      const taskNames = incompleteTasks.map((t) => t.taskName).join(', ')
      return apiBadRequest(`Cannot complete offboarding. Incomplete tasks: ${taskNames}`)
    }

    // Determine employee status based on separation type
    const newEmployeeStatus = SEPARATION_TO_STATUS[offboarding.separationType] || 'RESIGNED'

    const [updated] = await prisma.$transaction([
      prisma.offboarding.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
      prisma.employee.update({
        where: { id: offboarding.employeeId },
        data: { status: newEmployeeStatus as 'RESIGNED' | 'TERMINATED' | 'RETIRED' },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'offboarding',
      resourceId: id,
      description: `Completed offboarding "${offboarding.offboardingNo}" for employee "${offboarding.employee.fullName}"`,
      oldValues: { status: offboarding.status, employeeStatus: offboarding.employee.status },
      newValues: { status: 'COMPLETED', employeeStatus: newEmployeeStatus },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
