import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

const VALID_ADVANCE_TYPES = ['TRAVEL', 'ACTIVITY', 'OPERATIONAL'] as const

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { advanceNo: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) {
      where.employeeId = employeeId
    }

    const advanceType = url.searchParams.get('advanceType')
    if (advanceType) {
      where.advanceType = advanceType
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.requestDate = dateFilter
    }

    const [advances, total] = await Promise.all([
      prisma.employeeAdvance.findMany({
        where,
        select: {
          id: true,
          advanceNo: true,
          employeeId: true,
          requestDate: true,
          purpose: true,
          advanceType: true,
          estimatedAmount: true,
          approvedAmount: true,
          disbursedAmount: true,
          settledAmount: true,
          status: true,
          projectId: true,
          disbursedAt: true,
          settledAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { requestDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employeeAdvance.count({ where }),
    ])

    // Enrich with employee names
    const employeeIds = [...new Set(advances.map((a) => a.employeeId))]
    const employees =
      employeeIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, fullName: true, employeeNo: true },
          })
        : []

    const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]))

    const now = new Date()
    const enriched = advances.map((a) => {
      const disbursedAt = a.disbursedAt ? new Date(a.disbursedAt) : null
      const agingDays = disbursedAt ? Math.floor((now.getTime() - disbursedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
      return {
        ...a,
        date: a.requestDate,
        type: a.advanceType,
        employee: { id: a.employeeId, name: employeeMap.get(a.employeeId) || '-' },
        employeeName: employeeMap.get(a.employeeId) || null,
        agingDays,
        outstandingAmount: Number(a.disbursedAmount || 0) - Number(a.settledAmount || 0),
      }
    })

    return apiPaginated(enriched, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

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

    // Validate required fields
    if (!purpose || estimatedAmount === undefined || estimatedAmount === null || !advanceType) {
      return apiBadRequest('purpose, estimatedAmount, and advanceType are required')
    }

    // Validate advance type
    if (!VALID_ADVANCE_TYPES.includes(advanceType)) {
      return apiBadRequest(`advanceType must be one of: ${VALID_ADVANCE_TYPES.join(', ')}`)
    }

    // Validate amount
    const numAmount = Number(estimatedAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return apiBadRequest('estimatedAmount must be greater than 0')
    }

    // Find employee from auth user
    const employee = await prisma.employee.findFirst({
      where: { userId: auth.userId, organizationId: auth.organizationId },
    })
    if (!employee) {
      return apiBadRequest('No employee record found for the current user')
    }

    // Check for outstanding advances
    const outstandingAdvance = await prisma.employeeAdvance.findFirst({
      where: {
        organizationId: auth.organizationId,
        employeeId: employee.id,
        status: { in: ['APPROVED', 'DISBURSED', 'PARTIALLY_SETTLED'] },
      },
    })
    if (outstandingAdvance) {
      return apiBadRequest(
        `Employee already has an outstanding advance (${outstandingAdvance.advanceNo}) with status ${outstandingAdvance.status}. Please settle it before requesting a new one.`,
      )
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId },
      })
      if (!project) {
        return apiBadRequest('Invalid project ID')
      }
    }

    // Validate grantId if provided
    if (grantId) {
      const grant = await prisma.grant.findFirst({
        where: { id: grantId, donor: { organizationId: auth.organizationId } },
      })
      if (!grant) {
        return apiBadRequest('Invalid grant ID')
      }
    }

    // Generate advance number
    const advanceNo = await generateNextNumber(auth.organizationId, 'advance')

    const advance = await prisma.employeeAdvance.create({
      data: {
        organizationId: auth.organizationId,
        advanceNo,
        employeeId: employee.id,
        requestDate: new Date(),
        purpose: purpose.trim(),
        advanceType,
        estimatedAmount: new Prisma.Decimal(numAmount),
        projectId: projectId || null,
        grantId: grantId || null,
        travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
        travelEndDate: travelEndDate ? new Date(travelEndDate) : null,
        expectedSettlementDate: expectedSettlementDate
          ? new Date(expectedSettlementDate)
          : null,
        notes: notes || null,
        status: 'REQUESTED',
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'finance',
      resource: 'employee_advance',
      resourceId: advance.id,
      description: `Created advance request ${advanceNo} for ${purpose}`,
      newValues: { advanceNo, purpose, estimatedAmount: numAmount, advanceType },
      ...auditCtx,
    })

    return apiCreated(advance)
  } catch (error) {
    return handleRouteError(error)
  }
}
