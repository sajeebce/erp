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
    let retried = 0
    let succeeded = 0
    let failed = 0
    let endpointsDeactivated = 0

    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'FAILED',
        attempts: { lt: 5 },
      },
      include: {
        endpoint: true,
      },
    })

    for (const delivery of failedDeliveries) {
      if (!delivery.endpoint.isActive) continue

      retried++

      try {
        const response = await fetch(delivery.endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': delivery.endpoint.secret,
            'X-Webhook-Event': delivery.event,
            'X-Webhook-Delivery-Id': delivery.id,
          },
          body: JSON.stringify(delivery.payload),
          signal: AbortSignal.timeout(10_000),
        })

        if (response.ok) {
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SUCCESS',
              attempts: delivery.attempts + 1,
              responseStatus: response.status,
              deliveredAt: now,
            },
          })
          await prisma.webhookEndpoint.update({
            where: { id: delivery.endpointId },
            data: {
              lastDeliveredAt: now,
              failureCount: 0,
            },
          })
          succeeded++
        } else {
          const newAttempts = delivery.attempts + 1
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              attempts: newAttempts,
              responseStatus: response.status,
              responseBody: (await response.text()).slice(0, 1000),
              status: newAttempts >= 5 ? 'FAILED' : 'FAILED',
            },
          })

          // If this was the 5th attempt, increment endpoint failure count
          if (newAttempts >= 5) {
            const updatedEndpoint = await prisma.webhookEndpoint.update({
              where: { id: delivery.endpointId },
              data: { failureCount: { increment: 1 } },
            })

            // Deactivate endpoint if failureCount >= 10
            if (updatedEndpoint.failureCount >= 10) {
              await prisma.webhookEndpoint.update({
                where: { id: delivery.endpointId },
                data: { isActive: false },
              })
              endpointsDeactivated++
            }
          }
          failed++
        }
      } catch {
        const newAttempts = delivery.attempts + 1
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            attempts: newAttempts,
            responseBody: 'Connection error or timeout',
          },
        })

        if (newAttempts >= 5) {
          const updatedEndpoint = await prisma.webhookEndpoint.update({
            where: { id: delivery.endpointId },
            data: { failureCount: { increment: 1 } },
          })

          if (updatedEndpoint.failureCount >= 10) {
            await prisma.webhookEndpoint.update({
              where: { id: delivery.endpointId },
              data: { isActive: false },
            })
            endpointsDeactivated++
          }
        }
        failed++
      }
    }

    return apiSuccess({
      retried,
      succeeded,
      failed,
      endpointsDeactivated,
      checkedAt: now.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
