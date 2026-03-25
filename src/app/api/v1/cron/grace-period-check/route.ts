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
    let remindersLogged = 0
    let expired = 0

    const pastDueSubs = await prisma.tenantSubscription.findMany({
      where: {
        status: 'PAST_DUE',
        graceStartDate: { not: null },
      },
      select: {
        id: true,
        organizationId: true,
        graceStartDate: true,
        graceDays: true,
      },
    })

    for (const sub of pastDueSubs) {
      if (!sub.graceStartDate) continue

      const daysSinceGrace = Math.floor(
        (now.getTime() - sub.graceStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Day >= graceDays: move to EXPIRED
      if (daysSinceGrace >= sub.graceDays) {
        await prisma.tenantSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        })
        expired++
        continue
      }

      // Day 1, 3, 5: log reminder (TODO: send email)
      if ([1, 3, 5].includes(daysSinceGrace)) {
        console.log(
          `[grace-period-check] Reminder day ${daysSinceGrace} for org ${sub.organizationId}, subscription ${sub.id}. TODO: send email notification.`
        )
        remindersLogged++
      }
    }

    return apiSuccess({
      totalChecked: pastDueSubs.length,
      remindersLogged,
      expired,
      checkedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
