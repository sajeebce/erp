import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const settlement = await prisma.pFSettlement.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!settlement) {
      return apiNotFound('PF settlement not found')
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: settlement.employeeId,
        organizationId: auth.organizationId,
      },
      select: {
        id: true,
        fullName: true,
        employeeNo: true,
      },
    })

    return apiSuccess({
      ...settlement,
      employee,
      totalAmount:
        Number(settlement.employeeContrib) +
        Number(settlement.employerContrib) +
        Number(settlement.interestEarned),
      breakdown: {
        employeeContribution: Number(settlement.employeeContrib),
        employerContribution: Number(settlement.employerContrib),
        interestEarned: Number(settlement.interestEarned),
        vestedPercent: Number(settlement.vestedPercent),
        vestedEmployerAmount: Number(settlement.vestedEmployer),
        forfeitedAmount: Number(settlement.forfeited),
        loanDeduction: Number(settlement.loanDeduction),
        netPayable: Number(settlement.netPayable),
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
