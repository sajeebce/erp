import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { buildPayslipData } from '@/lib/hr/payslip'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        entries: {
          select: { id: true },
          orderBy: { employee: { fullName: 'asc' } },
        },
      },
    })

    if (!run) {
      return apiNotFound('Payroll run not found')
    }

    const payslips = await Promise.all(
      run.entries.map((entry) => buildPayslipData(entry.id, auth.organizationId))
    )

    // Filter out nulls (shouldn't happen but safety)
    const validPayslips = payslips.filter(Boolean)

    return apiSuccess(validPayslips)
  } catch (error) {
    return handleRouteError(error)
  }
}
