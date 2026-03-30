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

const VALID_ADVANCE_TYPES = ['TRAVEL', 'ACTIVITY', 'OPERATIONAL'] as const

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const advance = await prisma.employeeAdvance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!advance) {
      return apiNotFound('Advance not found')
    }

    // Enrich with related data
    const [employee, project, grant] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: advance.employeeId },
        select: { id: true, fullName: true, employeeNo: true, email: true },
      }),
      advance.projectId
        ? prisma.project.findFirst({
            where: { id: advance.projectId },
            select: { id: true, name: true, projectNo: true },
          })
        : null,
      advance.grantId
        ? prisma.grant.findFirst({
            where: { id: advance.grantId },
            select: { id: true, title: true, grantNo: true },
          })
        : null,
    ])

    return apiSuccess({
      ...advance,
      employee,
      project,
      grant,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.employeeAdvance.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Advance not found')
    }

    if (existing.status !== 'REQUESTED') {
      return apiBadRequest('Only REQUESTED advances can be updated')
    }

    const body = await request.json()
    const {
      purpose,
      estimatedAmount,
      advanceType,
      projectId,
      grantId,
      travelStartDate,
      travelEndDate,
      expectedSettlementDate,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}

    if (purpose !== undefined) updateData.purpose = purpose.trim()
    if (notes !== undefined) updateData.notes = notes || null

    if (advanceType !== undefined) {
      if (!VALID_ADVANCE_TYPES.includes(advanceType)) {
        return apiBadRequest(`advanceType must be one of: ${VALID_ADVANCE_TYPES.join(', ')}`)
      }
      updateData.advanceType = advanceType
    }

    if (estimatedAmount !== undefined) {
      const numAmount = Number(estimatedAmount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return apiBadRequest('estimatedAmount must be greater than 0')
      }
      updateData.estimatedAmount = new Prisma.Decimal(numAmount)
    }

    if (travelStartDate !== undefined)
      updateData.travelStartDate = travelStartDate ? new Date(travelStartDate) : null
    if (travelEndDate !== undefined)
      updateData.travelEndDate = travelEndDate ? new Date(travelEndDate) : null
    if (expectedSettlementDate !== undefined)
      updateData.expectedSettlementDate = expectedSettlementDate
        ? new Date(expectedSettlementDate)
        : null

    // Validate projectId if provided
    if (projectId !== undefined) {
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, organizationId: auth.organizationId },
        })
        if (!project) {
          return apiBadRequest('Invalid project ID')
        }
      }
      updateData.projectId = projectId || null
    }

    // Validate grantId if provided
    if (grantId !== undefined) {
      if (grantId) {
        const grant = await prisma.grant.findFirst({
          where: { id: grantId, donor: { organizationId: auth.organizationId } },
        })
        if (!grant) {
          return apiBadRequest('Invalid grant ID')
        }
      }
      updateData.grantId = grantId || null
    }

    const updated = await prisma.employeeAdvance.update({
      where: { id },
      data: updateData,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'employee_advance',
      resourceId: id,
      description: `Updated advance ${existing.advanceNo}`,
      oldValues: {
        purpose: existing.purpose,
        estimatedAmount: existing.estimatedAmount.toString(),
      },
      newValues: updateData,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
