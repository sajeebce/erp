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

    const disbursement = await prisma.loanDisbursement.findUnique({
      where: { id },
      select: {
        id: true,
        disbursementNo: true,
        loanAccountId: true,
        date: true,
        amount: true,
        mode: true,
        branchId: true,
        disbursedById: true,
        status: true,
        reference: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        loanAccount: {
          select: {
            accountNo: true,
            principalAmount: true,
            status: true,
            member: {
              select: {
                memberNo: true,
                beneficiary: { select: { id: true, name: true } },
                samity: {
                  select: {
                    samityNo: true,
                    name: true,
                    branch: { select: { code: true, name: true, organizationId: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!disbursement) {
      return apiNotFound('Disbursement not found')
    }

    // Tenant isolation check
    if (disbursement.loanAccount.member.samity.branch.organizationId !== auth.organizationId) {
      return apiNotFound('Disbursement not found')
    }

    return apiSuccess(disbursement)
  } catch (error) {
    return handleRouteError(error)
  }
}
