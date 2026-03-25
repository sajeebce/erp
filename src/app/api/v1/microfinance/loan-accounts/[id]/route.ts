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

    const account = await prisma.loanAccount.findUnique({
      where: { id },
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
        totalPaid: true,
        outstandingBalance: true,
        overdueAmount: true,
        daysOverdue: true,
        classification: true,
        disbursedAt: true,
        maturityDate: true,
        lastPaymentDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            memberNo: true,
            beneficiary: { select: { id: true, name: true, phone: true } },
            samity: {
              select: {
                id: true,
                samityNo: true,
                name: true,
                branch: { select: { id: true, code: true, name: true, organizationId: true } },
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            productCode: true,
            name: true,
            category: true,
            interestMethod: true,
          },
        },
        disbursement: {
          select: {
            id: true,
            disbursementNo: true,
            date: true,
            amount: true,
            mode: true,
            status: true,
            reference: true,
          },
        },
        repayments: {
          select: {
            id: true,
            repaymentNo: true,
            date: true,
            principalAmount: true,
            interestAmount: true,
            totalAmount: true,
            penaltyAmount: true,
            balanceAfter: true,
            isOnTime: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!account) {
      return apiNotFound('Loan account not found')
    }

    // Tenant isolation check
    if (account.member.samity.branch.organizationId !== auth.organizationId) {
      return apiNotFound('Loan account not found')
    }

    return apiSuccess(account)
  } catch (error) {
    return handleRouteError(error)
  }
}
