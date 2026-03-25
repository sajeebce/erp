import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      employee: { organizationId: auth.organizationId, deletedAt: null },
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) where.employeeId = employeeId

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const leaveTypeId = url.searchParams.get('leaveTypeId')
    if (leaveTypeId) where.leaveTypeId = leaveTypeId

    const [applications, total] = await Promise.all([
      prisma.leaveApplication.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeNo: true, fullName: true } },
          leaveType: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.leaveApplication.count({ where }),
    ])

    return apiPaginated(applications, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, leaveTypeId, startDate, endDate, days, reason } = body

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !days) {
      return apiBadRequest('employeeId, leaveTypeId, startDate, endDate, and days are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    // Check leave balance
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId },
      orderBy: { id: 'desc' },
    })

    if (balance && balance.remaining < days) {
      return apiBadRequest(`Insufficient leave balance. Available: ${balance.remaining}, Requested: ${days}`)
    }

    const applicationNo = await generateNextNumber(auth.organizationId, 'leave_application')

    const application = await prisma.leaveApplication.create({
      data: {
        applicationNo,
        employeeId,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason: reason || null,
        status: 'PENDING',
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'leave_application',
      resourceId: application.id,
      description: `Leave application ${applicationNo} by "${employee.fullName}" for ${days} days`,
      newValues: { applicationNo, employeeId, leaveTypeId, days },
      ...auditCtx,
    })

    return apiCreated(application)
  } catch (error) {
    return handleRouteError(error)
  }
}
