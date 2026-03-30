import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess, apiBadRequest, apiNotFound, handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const loan = await prisma.pFLoan.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!loan) {
      return apiNotFound('PF loan not found')
    }
    if (loan.status !== 'APPROVED') {
      return apiBadRequest(`Cannot disburse loan with status "${loan.status}"`)
    }

    // Generate repayment schedule
    const repayments = []
    const now = new Date()
    const principalPerMonth = new Prisma.Decimal(loan.principalAmount.toString()).div(loan.repaymentMonths)
    const interestPerMonth = loan.totalRepayable.sub(loan.principalAmount).div(loan.repaymentMonths)

    for (let i = 1; i <= loan.repaymentMonths; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      repayments.push({
        loanId: id,
        installmentNo: i,
        dueDate,
        principalPortion: principalPerMonth,
        interestPortion: interestPerMonth,
        totalAmount: loan.monthlyInstallment,
      })
    }

    await prisma.$transaction([
      prisma.pFLoan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          disbursedAt: new Date(),
        },
      }),
      prisma.pFEnrollment.update({
        where: { id: loan.enrollmentId },
        data: {
          totalLoanOutstanding: { increment: loan.totalRepayable },
        },
      }),
      prisma.pFLoanRepayment.createMany({ data: repayments }),
    ])

    const updated = await prisma.pFLoan.findFirst({
      where: { id },
      include: { repayments: { orderBy: { installmentNo: 'asc' } } },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'pf_loan',
      resourceId: id,
      description: `Disbursed PF loan ${loan.loanNo}`,
      oldValues: { status: 'APPROVED' },
      newValues: { status: 'ACTIVE' },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
