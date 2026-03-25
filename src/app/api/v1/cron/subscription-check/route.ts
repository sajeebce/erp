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
    let expiredTrials = 0
    let expiredPastDue = 0
    let resumedPaused = 0

    // TRIAL past trialEnd -> EXPIRED
    const trialResult = await prisma.tenantSubscription.updateMany({
      where: {
        status: 'TRIAL',
        trialEnd: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })
    expiredTrials = trialResult.count

    // PAST_DUE past grace period -> EXPIRED
    const pastDueSubs = await prisma.tenantSubscription.findMany({
      where: {
        status: 'PAST_DUE',
        graceStartDate: { not: null },
      },
      select: { id: true, graceStartDate: true, graceDays: true },
    })

    const pastDueExpiredIds: string[] = []
    for (const sub of pastDueSubs) {
      if (!sub.graceStartDate) continue
      const graceEnd = new Date(sub.graceStartDate)
      graceEnd.setDate(graceEnd.getDate() + sub.graceDays)
      if (now >= graceEnd) {
        pastDueExpiredIds.push(sub.id)
      }
    }

    if (pastDueExpiredIds.length > 0) {
      const result = await prisma.tenantSubscription.updateMany({
        where: { id: { in: pastDueExpiredIds } },
        data: { status: 'EXPIRED' },
      })
      expiredPastDue = result.count
    }

    // PAUSED past pausedUntil -> ACTIVE (auto-resume)
    const pausedResult = await prisma.tenantSubscription.updateMany({
      where: {
        status: 'PAUSED',
        pausedUntil: { lt: now },
      },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        pausedUntil: null,
      },
    })
    resumedPaused = pausedResult.count

    return apiSuccess({
      expiredTrials,
      expiredPastDue,
      resumedPaused,
      checkedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
