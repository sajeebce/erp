import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated, apiSuccess, apiBadRequest, apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const loan = await prisma.pFLoan.findFirst({
      where: { id, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (!loan) {
      return apiNotFound('PF loan not found')
    }

    const repayments = await prisma.pFLoanRepayment.findMany({
      where: { loanId: id },
      orderBy: { installmentNo: 'asc' },
    })

    return apiSuccess(repayments)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const loan = await prisma.pFLoan.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!loan) {
      return apiNotFound('PF loan not found')
    }
    if (loan.status !== 'ACTIVE') {
      return apiBadRequest('Loan is not active')
    }

    const { installmentNo, paidAmount, payrollRunId } = body

    if (!installmentNo || !paidAmount) {
      return apiBadRequest('installmentNo and paidAmount are required')
    }

    const repayment = await prisma.pFLoanRepayment.findFirst({
      where: { loanId: id, installmentNo },
    })
    if (!repayment) {
      return apiNotFound('Repayment installment not found')
    }
    if (repayment.status === 'PAID') {
      return apiBadRequest('This installment is already paid')
    }

    const newOutstanding = loan.outstandingBalance.sub(paidAmount)
    const isCompleted = newOutstanding.lte(0)

    await prisma.$transaction([
      prisma.pFLoanRepayment.update({
        where: { id: repayment.id },
        data: {
          paidAmount,
          paidAt: new Date(),
          payrollRunId: payrollRunId || null,
          status: 'PAID',
        },
      }),
      prisma.pFLoan.update({
        where: { id },
        data: {
          outstandingBalance: newOutstanding.lt(0) ? 0 : newOutstanding,
          ...(isCompleted ? { status: 'COMPLETED' } : {}),
        },
      }),
      prisma.pFEnrollment.update({
        where: { id: loan.enrollmentId },
        data: {
          totalLoanOutstanding: { decrement: paidAmount },
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_loan_repayment',
      resourceId: repayment.id,
      description: `Recorded PF loan repayment #${installmentNo} for loan ${loan.loanNo}`,
      newValues: { installmentNo, paidAmount },
      ...auditCtx,
    })

    return apiCreated({ repaymentId: repayment.id, installmentNo, paidAmount, loanCompleted: isCompleted })
  } catch (error) {
    return handleRouteError(error)
  }
}
