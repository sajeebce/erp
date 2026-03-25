import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * EMI calculation (declining balance):
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 *
 * Flat rate:
 * Total Interest = P * annual_rate / 100 * duration_months / 12
 * Monthly installment = (P + Total Interest) / duration_months
 */
function calculateInstallment(
  principal: number,
  annualRate: number,
  durationMonths: number,
  method: string
): { installmentAmount: number; totalRepayable: number } {
  if (method === 'FLAT') {
    const totalInterest = principal * (annualRate / 100) * (durationMonths / 12)
    const totalRepayable = principal + totalInterest
    const installmentAmount = totalRepayable / durationMonths
    return {
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      totalRepayable: Math.round(totalRepayable * 100) / 100,
    }
  }

  // DECLINING_BALANCE (EMI)
  const r = annualRate / 12 / 100
  if (r === 0) {
    return {
      installmentAmount: Math.round((principal / durationMonths) * 100) / 100,
      totalRepayable: principal,
    }
  }

  const factor = Math.pow(1 + r, durationMonths)
  const emi = principal * r * factor / (factor - 1)
  const totalRepayable = emi * durationMonths

  return {
    installmentAmount: Math.round(emi * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100,
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()
    const { approvedAmount } = body

    // Find application with tenant chain validation
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!application) {
      return apiNotFound('Loan application not found')
    }

    // Validate tenant via member → samity → branch → org
    const member = await prisma.mFIMember.findFirst({
      where: {
        id: application.memberId,
        samity: { branch: { organizationId: auth.organizationId } },
      },
    })

    if (!member) {
      return apiNotFound('Loan application not found')
    }

    if (application.status !== 'SUBMITTED' && application.status !== 'RECOMMENDED') {
      return apiBadRequest(`Cannot approve application with status: ${application.status}`)
    }

    const principal = approvedAmount != null ? Number(approvedAmount) : Number(application.amountRequested)
    const annualRate = Number(application.product.interestRate)
    const durationMonths = application.durationMonths

    const { installmentAmount, totalRepayable } = calculateInstallment(
      principal,
      annualRate,
      durationMonths,
      application.product.interestMethod
    )

    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + durationMonths)

    const accountNo = await generateNextNumber(auth.organizationId, 'mfi_loan_account')

    const [loanAccount] = await prisma.$transaction([
      prisma.loanAccount.create({
        data: {
          accountNo,
          memberId: application.memberId,
          productId: application.productId,
          principalAmount: principal,
          interestRate: annualRate,
          interestMethod: application.product.interestMethod,
          durationMonths,
          installmentAmount,
          totalRepayable,
          outstandingBalance: totalRepayable,
          maturityDate,
          status: 'PENDING_DISBURSEMENT',
        },
        select: {
          id: true,
          accountNo: true,
          memberId: true,
          productId: true,
          principalAmount: true,
          interestRate: true,
          interestMethod: true,
          durationMonths: true,
          installmentAmount: true,
          totalRepayable: true,
          outstandingBalance: true,
          maturityDate: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.loanApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAmount: principal,
          approvedById: auth.userId,
          approvedAt: new Date(),
        },
      }),
    ])

    return apiCreated(loanAccount)
  } catch (error) {
    return handleRouteError(error)
  }
}
