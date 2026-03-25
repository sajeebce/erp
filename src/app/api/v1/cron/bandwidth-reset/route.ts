import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiUnauthorized, handleRouteError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return apiUnauthorized('Invalid cron secret')
    }

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const result = await prisma.organization.updateMany({
      where: { isActive: true },
      data: {
        bandwidthUsedBytes: BigInt(0),
        bandwidthWarning80Sent: false,
        bandwidthWarning90Sent: false,
        bandwidthPeriodStart: periodStart,
        bandwidthPeriodEnd: periodEnd,
      },
    })

    return apiSuccess({
      orgsReset: result.count,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      resetAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
