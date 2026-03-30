import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            basicSalary: true,
            joiningDate: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
        nominees: true,
      },
    })

    if (!enrollment) {
      return apiNotFound('PF enrollment not found')
    }

    return apiSuccess(enrollment)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.pFEnrollment.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('PF enrollment not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.employeeRate !== undefined) data.employeeRate = body.employeeRate
    if (body.employerRate !== undefined) data.employerRate = body.employerRate
    if (body.status !== undefined) data.status = body.status

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.pFEnrollment.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_enrollment',
      resourceId: id,
      description: `Updated PF enrollment for employee ${existing.employeeId}`,
      oldValues: { employeeRate: existing.employeeRate.toString(), employerRate: existing.employerRate.toString() },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
