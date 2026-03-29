import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
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

    const existing = await prisma.employeeContract.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: { select: { id: true, fullName: true } },
      },
    })
    if (!existing) {
      return apiNotFound('Contract not found')
    }

    if (existing.status === 'TERMINATED') {
      return apiBadRequest('Cannot renew a terminated contract')
    }

    const { startDate, basicSalary } = body
    if (!startDate || basicSalary === undefined) {
      return apiBadRequest('startDate and basicSalary are required for renewal')
    }

    const contractNo = await generateNextNumber(auth.organizationId, 'employee-contract')

    const [newContract] = await prisma.$transaction([
      prisma.employeeContract.create({
        data: {
          organizationId: auth.organizationId,
          contractNo,
          employeeId: existing.employeeId,
          contractType: body.contractType || existing.contractType,
          title: body.title || existing.title,
          startDate: new Date(startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          probationEndDate: body.probationEndDate ? new Date(body.probationEndDate) : null,
          basicSalary: new Prisma.Decimal(basicSalary),
          currency: body.currency || existing.currency,
          salaryComponents: body.salaryComponents || existing.salaryComponents,
          projectId: body.projectId || existing.projectId,
          grantId: body.grantId || existing.grantId,
          costCenter: body.costCenter || existing.costCenter,
          isRenewable: body.isRenewable ?? existing.isRenewable,
          renewalNoticeDays: body.renewalNoticeDays ?? existing.renewalNoticeDays,
          noticePeriodDays: body.noticePeriodDays ?? existing.noticePeriodDays,
          previousContractId: id,
          status: 'ACTIVE',
          notes: body.notes || null,
        },
      }),
      prisma.employeeContract.update({
        where: { id },
        data: { status: 'RENEWED' },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'employee_contract',
      resourceId: newContract.id,
      description: `Renewed contract "${existing.contractNo}" → "${contractNo}" for employee "${existing.employee.fullName}"`,
      oldValues: { previousContractId: id, previousStatus: existing.status },
      newValues: { contractNo, startDate, basicSalary },
      ...auditCtx,
    })

    return apiCreated(newContract)
  } catch (error) {
    return handleRouteError(error)
  }
}
