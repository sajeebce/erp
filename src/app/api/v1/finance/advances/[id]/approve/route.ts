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
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json()
    const { approvedAmount } = body

    const advance = await prisma.employeeAdvance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!advance) {
      return apiNotFound('Advance not found')
    }

    if (advance.status !== 'REQUESTED') {
      return apiBadRequest(
        'Only REQUESTED advances can be approved. Current status: ' + advance.status,
      )
    }

    // Use provided approved amount or default to estimated
    const numApproved = approvedAmount !== undefined
      ? Number(approvedAmount)
      : Number(advance.estimatedAmount)

    if (isNaN(numApproved) || numApproved <= 0) {
      return apiBadRequest('approvedAmount must be greater than 0')
    }

    const now = new Date()

    const updated = await prisma.employeeAdvance.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: now,
        approvedAmount: new Prisma.Decimal(numApproved),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'finance',
      resource: 'employee_advance',
      resourceId: id,
      description: `Approved advance ${advance.advanceNo} for amount ${numApproved}`,
      oldValues: { status: 'REQUESTED' },
      newValues: { status: 'APPROVED', approvedAmount: numApproved, approvedAt: now },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
