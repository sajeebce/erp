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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const contract = await prisma.employeeContract.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            email: true,
            phone: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
      },
    })

    if (!contract) {
      return apiNotFound('Contract not found')
    }

    return apiSuccess(contract)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.employeeContract.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Contract not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title.trim()
    if (body.contractType !== undefined) data.contractType = body.contractType
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.probationEndDate !== undefined) data.probationEndDate = body.probationEndDate ? new Date(body.probationEndDate) : null
    if (body.basicSalary !== undefined) data.basicSalary = new Prisma.Decimal(body.basicSalary)
    if (body.currency !== undefined) data.currency = body.currency
    if (body.salaryComponents !== undefined) data.salaryComponents = body.salaryComponents
    if (body.projectId !== undefined) data.projectId = body.projectId || null
    if (body.grantId !== undefined) data.grantId = body.grantId || null
    if (body.costCenter !== undefined) data.costCenter = body.costCenter || null
    if (body.contractFilePath !== undefined) data.contractFilePath = body.contractFilePath || null
    if (body.amendments !== undefined) data.amendments = body.amendments
    if (body.isRenewable !== undefined) data.isRenewable = body.isRenewable
    if (body.renewalNoticeDays !== undefined) data.renewalNoticeDays = body.renewalNoticeDays
    if (body.noticePeriodDays !== undefined) data.noticePeriodDays = body.noticePeriodDays
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes || null

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.employeeContract.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'employee_contract',
      resourceId: id,
      description: `Updated contract "${existing.contractNo}"`,
      oldValues: { status: existing.status, title: existing.title },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
