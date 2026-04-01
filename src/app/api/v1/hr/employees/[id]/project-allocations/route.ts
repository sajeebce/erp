import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const allocations = await prisma.employeeProjectAllocation.findMany({
      where: { employeeId },
      include: {
        project: { select: { id: true, projectNo: true, name: true, status: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    return apiSuccess(allocations)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params
    const body = await request.json()

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const { projectId, percentage, startDate, endDate } = body

    if (!projectId) return apiBadRequest('projectId is required')
    if (percentage == null || percentage <= 0 || percentage > 100) {
      return apiBadRequest('percentage must be between 0.01 and 100')
    }
    if (!startDate) return apiBadRequest('startDate is required')

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId },
      select: { id: true, name: true },
    })

    if (!project) {
      return apiNotFound('Project not found')
    }

    // Validate total active allocations <= 100%
    const existingAllocations = await prisma.employeeProjectAllocation.findMany({
      where: { employeeId, isActive: true },
      select: { percentage: true },
    })

    const currentTotal = existingAllocations.reduce(
      (sum, a) => sum + Number(a.percentage), 0
    )

    if (currentTotal + Number(percentage) > 100) {
      return apiBadRequest(
        `Total allocation would be ${currentTotal + Number(percentage)}%. ` +
        `Current active total is ${currentTotal}%, max allowed is 100%.`
      )
    }

    const allocation = await prisma.employeeProjectAllocation.create({
      data: {
        employeeId,
        projectId,
        percentage: new Prisma.Decimal(percentage),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
      include: {
        project: { select: { id: true, projectNo: true, name: true } },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'employee_project_allocation',
      resourceId: allocation.id,
      description: `Allocated ${percentage}% of ${employee.fullName} to project ${project.name}`,
      newValues: { projectId, percentage, startDate },
      ...auditCtx,
    })

    return apiCreated(allocation)
  } catch (error) {
    return handleRouteError(error)
  }
}
