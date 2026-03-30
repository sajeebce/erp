import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, apiNotFound, handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params

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
          },
        },
        accruals: {
          orderBy: [{ accrualYear: 'desc' }, { accrualMonth: 'desc' }],
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!ledger) {
      return apiNotFound('Gratuity ledger not found for this employee')
    }

    const now = new Date()
    const serviceMs = now.getTime() - new Date(ledger.serviceStartDate).getTime()
    const serviceYears = Math.floor(serviceMs / (365.25 * 24 * 60 * 60 * 1000) * 100) / 100

    return apiSuccess({ ...ledger, serviceYears })
  } catch (error) {
    return handleRouteError(error)
  }
}
