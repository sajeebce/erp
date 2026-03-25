import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiPaginated,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)
    const status = url.searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    const [subscriptions, total] = await Promise.all([
      prisma.tenantSubscription.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          plan: { select: { id: true, name: true, priceMonthly: true, maxUsers: true, storageGb: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.tenantSubscription.count({ where }),
    ])

    const data = subscriptions.map((sub) => ({
      id: sub.id,
      organizationId: sub.organizationId,
      organizationName: sub.organization.name,
      organizationSlug: sub.organization.slug,
      planId: sub.planId,
      planName: sub.plan.name,
      priceMonthly: sub.plan.priceMonthly.toString(),
      status: sub.status,
      billingCycle: sub.billingCycle,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      trialStart: sub.trialStart,
      trialEnd: sub.trialEnd,
      scheduledPlanId: sub.scheduledPlanId,
      scheduledChangeDate: sub.scheduledChangeDate,
      lastPaymentDate: sub.lastPaymentDate,
      nextPaymentDate: sub.nextPaymentDate,
      cancelledAt: sub.cancelledAt,
      maxUsers: sub.plan.maxUsers,
      storageGb: sub.plan.storageGb,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }))

    return apiPaginated(data, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
