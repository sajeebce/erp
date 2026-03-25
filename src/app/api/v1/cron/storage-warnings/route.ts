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
    let storageWarnings80 = 0
    let storageWarnings90 = 0
    let bandwidthWarnings80 = 0
    let bandwidthWarnings90 = 0

    const orgs = await prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        storageUsedBytes: true,
        storageWarning80Sent: true,
        storageWarning90Sent: true,
        bandwidthUsedBytes: true,
        bandwidthWarning80Sent: true,
        bandwidthWarning90Sent: true,
        subscription: {
          select: {
            plan: {
              select: {
                storageGb: true,
                bandwidthGb: true,
              },
            },
          },
        },
      },
    })

    for (const org of orgs) {
      if (!org.subscription) continue

      const storageLimitBytes = BigInt(org.subscription.plan.storageGb) * BigInt(1024 * 1024 * 1024)
      const bandwidthLimitBytes = BigInt(org.subscription.plan.bandwidthGb) * BigInt(1024 * 1024 * 1024)

      // Storage warnings
      if (storageLimitBytes > BigInt(0)) {
        const storagePercent = Number((org.storageUsedBytes * BigInt(100)) / storageLimitBytes)

        if (storagePercent >= 90 && !org.storageWarning90Sent) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { storageWarning90Sent: true },
          })
          console.log(`[storage-warnings] Org ${org.id}: storage at ${storagePercent}% (>=90%). TODO: send email.`)
          storageWarnings90++
        } else if (storagePercent >= 80 && !org.storageWarning80Sent) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { storageWarning80Sent: true },
          })
          console.log(`[storage-warnings] Org ${org.id}: storage at ${storagePercent}% (>=80%). TODO: send email.`)
          storageWarnings80++
        }
      }

      // Bandwidth warnings
      if (bandwidthLimitBytes > BigInt(0)) {
        const bandwidthPercent = Number((org.bandwidthUsedBytes * BigInt(100)) / bandwidthLimitBytes)

        if (bandwidthPercent >= 90 && !org.bandwidthWarning90Sent) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { bandwidthWarning90Sent: true },
          })
          console.log(`[storage-warnings] Org ${org.id}: bandwidth at ${bandwidthPercent}% (>=90%). TODO: send email.`)
          bandwidthWarnings90++
        } else if (bandwidthPercent >= 80 && !org.bandwidthWarning80Sent) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { bandwidthWarning80Sent: true },
          })
          console.log(`[storage-warnings] Org ${org.id}: bandwidth at ${bandwidthPercent}% (>=80%). TODO: send email.`)
          bandwidthWarnings80++
        }
      }
    }

    return apiSuccess({
      totalOrgsChecked: orgs.length,
      storageWarnings80,
      storageWarnings90,
      bandwidthWarnings80,
      bandwidthWarnings90,
      checkedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
