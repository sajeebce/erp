import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const fund = await prisma.gratuityFund.findFirst({
      where: { organizationId: auth.organizationId, isActive: true },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
        },
      },
    })

    // Total liability from ledgers
    const liabilityAgg = await prisma.gratuityLedger.aggregate({
      where: { organizationId: auth.organizationId, isActive: true },
      _sum: { currentBalance: true },
    })

    return apiSuccess({
      fund,
      totalLiability: liabilityAgg._sum.currentBalance?.toString() || '0',
      fundBalance: fund?.currentBalance?.toString() || '0',
      totalFdr: fund?.totalFdr?.toString() || '0',
      fdrDetails: fund?.fdrDetails || [],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
