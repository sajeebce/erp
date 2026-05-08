import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
  apiPaginated,
} from '@/lib/api-response'
import { buildPayslipData } from '@/lib/hr/payslip'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    // Verify employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    // Get all payroll entries for this employee, ordered by month/year DESC
    const [entries, total] = await Promise.all([
      prisma.payrollEntry.findMany({
        where: { employeeId },
        include: {
          payrollRun: { select: { month: true, year: true } },
        },
        orderBy: [
          { payrollRun: { year: 'desc' } },
          { payrollRun: { month: 'desc' } },
        ],
        skip,
        take: limit,
      }),
      prisma.payrollEntry.count({ where: { employeeId } }),
    ])

    const payslips = await Promise.all(
      entries.map((entry) => buildPayslipData(entry.id, auth.organizationId))
    )

    const validPayslips = payslips.filter(Boolean)

    return apiPaginated(validPayslips, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
