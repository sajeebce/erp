import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, apiBadRequest, apiNotFound, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')

    if (!employeeId) {
      return apiBadRequest('employeeId query parameter is required')
    }

    const ledger = await prisma.gratuityLedger.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            joiningDate: true,
            basicSalary: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
        accruals: {
          orderBy: [{ accrualYear: 'asc' }, { accrualMonth: 'asc' }],
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ledger) {
      return apiNotFound('No gratuity ledger found for this employee')
    }

    const now = new Date()
    const serviceMs = now.getTime() - new Date(ledger.serviceStartDate).getTime()
    const serviceYears = Math.floor(serviceMs / (365.25 * 24 * 60 * 60 * 1000) * 100) / 100

    return apiSuccess({
      employee: ledger.employee,
      serviceStartDate: ledger.serviceStartDate,
      serviceYears,
      isVested: ledger.isVested,
      totalAccrued: ledger.totalAccrued.toString(),
      totalPaid: ledger.totalPaid.toString(),
      currentBalance: ledger.currentBalance.toString(),
      accruals: ledger.accruals,
      payments: ledger.payments,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
