import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const application = await prisma.leaveApplication.findFirst({
      where: {
        id,
        employee: { organizationId: auth.organizationId },
      },
      include: {
        employee: { select: { fullName: true } },
      },
    })

    if (!application) {
      return apiNotFound('Leave application not found')
    }

    if (application.status !== 'PENDING') {
      return apiBadRequest('Leave application is not pending')
    }

    // Update leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: application.employeeId,
        leaveTypeId: application.leaveTypeId,
      },
      orderBy: { id: 'desc' },
    })

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.leaveApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: auth.userId,
          approvedAt: new Date(),
        },
      })

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            taken: { increment: application.days },
            remaining: { decrement: application.days },
          },
        })
      }

      return result
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'leave_application',
      resourceId: id,
      description: `Approved leave application ${application.applicationNo}`,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
