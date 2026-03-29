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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.employeeContract.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: { select: { fullName: true } },
      },
    })
    if (!existing) {
      return apiNotFound('Contract not found')
    }

    if (existing.status === 'TERMINATED') {
      return apiBadRequest('Contract is already terminated')
    }

    const { terminationReason } = body
    if (!terminationReason) {
      return apiBadRequest('terminationReason is required')
    }

    const updated = await prisma.employeeContract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminationReason,
        terminatedAt: body.terminatedAt ? new Date(body.terminatedAt) : new Date(),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'employee_contract',
      resourceId: id,
      description: `Terminated contract "${existing.contractNo}" for employee "${existing.employee.fullName}"`,
      oldValues: { status: existing.status },
      newValues: { status: 'TERMINATED', terminationReason },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
