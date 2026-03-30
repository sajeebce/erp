import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated, apiPaginated, apiBadRequest,
  handleRouteError, parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Prisma.PFLoanWhereInput = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    const employeeId = url.searchParams.get('employeeId')
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const [loans, total] = await Promise.all([
      prisma.pFLoan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pFLoan.count({ where }),
    ])

    return apiPaginated(loans, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, principalAmount, repaymentMonths } = body

    if (!employeeId || !principalAmount || !repaymentMonths) {
      return apiBadRequest('employeeId, principalAmount, and repaymentMonths are required')
    }

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { organizationId: auth.organizationId, employeeId, status: 'ACTIVE' },
    })
    if (!enrollment) {
      return apiBadRequest('No active PF enrollment found for this employee')
    }

    // Get policy for loan rules
    const policy = await prisma.pFPolicy.findFirst({
      where: { id: enrollment.policyId },
    })

    if (policy && !policy.allowLoan) {
      return apiBadRequest('PF loans are not allowed under this policy')
    }

    // Check active loans
    if (policy) {
      const activeLoans = await prisma.pFLoan.count({
        where: { enrollmentId: enrollment.id, status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] } },
      })
      if (activeLoans >= policy.maxActiveLoans) {
        return apiBadRequest(`Maximum active loans (${policy.maxActiveLoans}) reached`)
      }
    }

    const interestRate = policy?.loanInterestRate ? Number(policy.loanInterestRate) : 5.0
    const principal = new Prisma.Decimal(principalAmount)
    const totalInterest = principal.mul(interestRate).div(100).mul(repaymentMonths).div(12)
    const totalRepayable = principal.add(totalInterest)
    const monthlyInstallment = totalRepayable.div(repaymentMonths)

    const loanNo = await generateNextNumber(auth.organizationId, 'pf_loan')

    const loan = await prisma.pFLoan.create({
      data: {
        organizationId: auth.organizationId,
        loanNo,
        enrollmentId: enrollment.id,
        employeeId,
        principalAmount,
        interestRate,
        repaymentMonths,
        monthlyInstallment,
        totalRepayable,
        outstandingBalance: totalRepayable,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_loan',
      resourceId: loan.id,
      description: `Created PF loan ${loanNo} for ${principalAmount}`,
      newValues: { loanNo, principalAmount, repaymentMonths },
      ...auditCtx,
    })

    return apiCreated(loan)
  } catch (error) {
    return handleRouteError(error)
  }
}
