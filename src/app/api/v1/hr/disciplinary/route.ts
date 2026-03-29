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
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { caseNo: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ]
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) where.employeeId = employeeId

    const action = url.searchParams.get('action')
    if (action) where.action = action

    const [cases, total] = await Promise.all([
      prisma.disciplinaryCase.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.disciplinaryCase.count({ where }),
    ])

    return apiPaginated(cases, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, action, reason, description, incidentDate, actionDate } = body

    if (!employeeId || !action || !reason || !description || !incidentDate || !actionDate) {
      return apiBadRequest('employeeId, action, reason, description, incidentDate, and actionDate are required')
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) return apiBadRequest('Employee not found in this organization')

    const caseNo = await generateNextNumber(auth.organizationId, 'disciplinary')

    const disciplinaryCase = await prisma.disciplinaryCase.create({
      data: {
        organizationId: auth.organizationId,
        caseNo,
        employeeId,
        action,
        reason,
        description,
        incidentDate: new Date(incidentDate),
        actionDate: new Date(actionDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        suspensionStart: body.suspensionStart ? new Date(body.suspensionStart) : null,
        suspensionEnd: body.suspensionEnd ? new Date(body.suspensionEnd) : null,
        withPay: body.withPay ?? true,
        evidencePaths: body.evidencePaths || null,
        issuedById: auth.userId,
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'disciplinary_case',
      resourceId: disciplinaryCase.id,
      description: `Created disciplinary case "${caseNo}" for employee "${employee.fullName}" — ${action}`,
      newValues: { caseNo, employeeId, action, reason },
      ...auditCtx,
    })

    return apiCreated(disciplinaryCase)
  } catch (error) {
    return handleRouteError(error)
  }
}
