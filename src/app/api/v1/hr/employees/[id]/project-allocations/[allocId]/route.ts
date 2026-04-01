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
  params: Promise<{ id: string; allocId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, allocId } = await params
    const body = await request.json()

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const existing = await prisma.employeeProjectAllocation.findFirst({
      where: { id: allocId, employeeId },
    })

    if (!existing) {
      return apiNotFound('Allocation not found')
    }

    const newPercentage = body.percentage ?? Number(existing.percentage)

    // Validate total active allocations <= 100%
    if (body.percentage != null) {
      if (newPercentage <= 0 || newPercentage > 100) {
        return apiBadRequest('percentage must be between 0.01 and 100')
      }

      const otherAllocations = await prisma.employeeProjectAllocation.findMany({
        where: { employeeId, isActive: true, id: { not: allocId } },
        select: { percentage: true },
      })

      const othersTotal = otherAllocations.reduce(
        (sum, a) => sum + Number(a.percentage), 0
      )

      if (othersTotal + newPercentage > 100) {
        return apiBadRequest(
          `Total allocation would be ${othersTotal + newPercentage}%. ` +
          `Other active allocations total ${othersTotal}%, max allowed is 100%.`
        )
      }
    }

    const updated = await prisma.employeeProjectAllocation.update({
      where: { id: allocId },
      data: {
        ...(body.percentage != null && { percentage: new Prisma.Decimal(body.percentage) }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        project: { select: { id: true, projectNo: true, name: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'employee_project_allocation',
      resourceId: allocId,
      description: `Updated project allocation for ${employee.fullName}`,
      oldValues: { percentage: Number(existing.percentage) },
      newValues: { percentage: newPercentage },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, allocId } = await params

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const existing = await prisma.employeeProjectAllocation.findFirst({
      where: { id: allocId, employeeId },
    })

    if (!existing) {
      return apiNotFound('Allocation not found')
    }

    // Soft-delete: set isActive = false
    await prisma.employeeProjectAllocation.update({
      where: { id: allocId },
      data: { isActive: false },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'hr',
      resource: 'employee_project_allocation',
      resourceId: allocId,
      description: `Deactivated project allocation for ${employee.fullName}`,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ...auditCtx,
    })

    return apiSuccess({ id: allocId, isActive: false })
  } catch (error) {
    return handleRouteError(error)
  }
}
