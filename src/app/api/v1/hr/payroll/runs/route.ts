import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    // PayrollRun doesn't have organizationId, filter through entries → employee
    const where: Record<string, unknown> = {}

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [runs, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        select: {
          id: true,
          runNo: true,
          month: true,
          year: true,
          totalGross: true,
          totalDeductions: true,
          totalNet: true,
          employeeCount: true,
          status: true,
          processedAt: true,
          approvedAt: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.payrollRun.count({ where }),
    ])

    return apiPaginated(runs, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { month, year } = body

    if (!month || !year) {
      return apiBadRequest('month and year are required')
    }

    if (month < 1 || month > 12) {
      return apiBadRequest('month must be between 1 and 12')
    }

    // Check unique per month+year
    const existing = await prisma.payrollRun.findUnique({
      where: { month_year: { month, year } },
    })
    if (existing) {
      return apiConflict(`Payroll run for ${month}/${year} already exists`)
    }

    const runNo = await generateNextNumber(auth.organizationId, 'payroll_run')

    const run = await prisma.payrollRun.create({
      data: {
        runNo,
        month,
        year,
        status: 'DRAFT',
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'payroll_run',
      resourceId: run.id,
      description: `Created payroll run ${runNo} for ${month}/${year}`,
      newValues: { runNo, month, year },
      ...auditCtx,
    })

    return apiCreated(run)
  } catch (error) {
    return handleRouteError(error)
  }
}
