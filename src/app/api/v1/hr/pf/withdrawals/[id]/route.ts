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

    const withdrawal = await prisma.pFWithdrawal.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!withdrawal) {
      return apiNotFound('PF withdrawal not found')
    }

    return apiSuccess(withdrawal)
  } catch (error) {
    return handleRouteError(error)
  }
}
