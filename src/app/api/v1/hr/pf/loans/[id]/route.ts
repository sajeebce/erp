import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, apiNotFound, handleRouteError,
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
      include: {
        repayments: {
          orderBy: { installmentNo: 'asc' },
        },
      },
    })

    if (!loan) {
      return apiNotFound('PF loan not found')
    }

    return apiSuccess(loan)
  } catch (error) {
    return handleRouteError(error)
  }
}
