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
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { contractNo: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { employee: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) where.employeeId = employeeId

    const expiringDays = url.searchParams.get('expiringDays')
    if (expiringDays) {
      const days = parseInt(expiringDays, 10)
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + days)
      where.endDate = { gte: now, lte: future }
      where.status = 'ACTIVE'
    }

    const [contracts, total] = await Promise.all([
      prisma.employeeContract.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeNo: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.employeeContract.count({ where }),
    ])

    return apiPaginated(contracts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, contractType, title, startDate, basicSalary } = body

    if (!employeeId || !contractType || !title || !startDate || basicSalary === undefined) {
      return apiBadRequest('employeeId, contractType, title, startDate, and basicSalary are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) return apiBadRequest('Employee not found in this organization')

    const contractNo = await generateNextNumber(auth.organizationId, 'employee-contract')

    const contract = await prisma.employeeContract.create({
      data: {
        organizationId: auth.organizationId,
        contractNo,
        employeeId,
        contractType,
        title: title.trim(),
        startDate: new Date(startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        probationEndDate: body.probationEndDate ? new Date(body.probationEndDate) : null,
        basicSalary: new Prisma.Decimal(basicSalary),
        currency: body.currency || 'BDT',
        salaryComponents: body.salaryComponents || null,
        projectId: body.projectId || null,
        grantId: body.grantId || null,
        costCenter: body.costCenter || null,
        contractFilePath: body.contractFilePath || null,
        isRenewable: body.isRenewable ?? true,
        renewalNoticeDays: body.renewalNoticeDays ?? 30,
        noticePeriodDays: body.noticePeriodDays ?? 30,
        status: body.status || 'ACTIVE',
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'employee_contract',
      resourceId: contract.id,
      description: `Created contract "${contractNo}" for employee "${employee.fullName}"`,
      newValues: { contractNo, employeeId, contractType, title, basicSalary },
      ...auditCtx,
    })

    return apiCreated(contract)
  } catch (error) {
    return handleRouteError(error)
  }
}
