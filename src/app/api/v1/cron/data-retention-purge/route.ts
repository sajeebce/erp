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
    let totalPoliciesProcessed = 0
    let totalRecordsDeleted = 0
    const details: Array<{
      organizationId: string
      entityType: string
      recordsDeleted: number
    }> = []

    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
    })

    for (const policy of policies) {
      const threshold = new Date(now)
      threshold.setDate(threshold.getDate() - policy.retentionDays)

      let deletedCount = 0

      switch (policy.entityType) {
        case 'audit_log': {
          const result = await prisma.tenantAuditLog.deleteMany({
            where: {
              organizationId: policy.organizationId,
              createdAt: { lt: threshold },
            },
          })
          deletedCount = result.count
          break
        }
        case 'notification': {
          // Notifications are user-scoped; delete for all users in this org
          const orgUsers = await prisma.user.findMany({
            where: { organizationId: policy.organizationId },
            select: { id: true },
          })
          const userIds = orgUsers.map((u) => u.id)

          if (userIds.length > 0) {
            const result = await prisma.notification.deleteMany({
              where: {
                userId: { in: userIds },
                createdAt: { lt: threshold },
              },
            })
            deletedCount = result.count
          }
          break
        }
        default: {
          console.log(
            `[data-retention-purge] Unknown entity type "${policy.entityType}" for policy ${policy.id}, skipping.`
          )
          continue
        }
      }

      await prisma.dataRetentionPolicy.update({
        where: { id: policy.id },
        data: { lastPurgedAt: now },
      })

      totalPoliciesProcessed++
      totalRecordsDeleted += deletedCount
      details.push({
        organizationId: policy.organizationId,
        entityType: policy.entityType,
        recordsDeleted: deletedCount,
      })
    }

    return apiSuccess({
      totalPoliciesProcessed,
      totalRecordsDeleted,
      details,
      purgedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
