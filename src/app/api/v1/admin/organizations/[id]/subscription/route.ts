import { NextRequest } from 'next/server'
import { type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const { id } = await params

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { organizationId: id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        plan: true,
      },
    })

    if (!subscription) {
      return apiNotFound('No subscription found for this organization')
    }

    return apiSuccess({
      id: subscription.id,
      organizationId: subscription.organizationId,
      organizationName: subscription.organization.name,
      organizationSlug: subscription.organization.slug,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      graceStartDate: subscription.graceStartDate,
      graceDays: subscription.graceDays,
      pausedAt: subscription.pausedAt,
      pausedUntil: subscription.pausedUntil,
      totalPauseDaysUsed: subscription.totalPauseDaysUsed,
      scheduledPlanId: subscription.scheduledPlanId,
      scheduledChangeDate: subscription.scheduledChangeDate,
      scheduledChangeType: subscription.scheduledChangeType,
      lastPaymentDate: subscription.lastPaymentDate,
      nextPaymentDate: subscription.nextPaymentDate,
      cancelledAt: subscription.cancelledAt,
      cancellationReason: subscription.cancellationReason,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        description: subscription.plan.description,
        priceMonthly: subscription.plan.priceMonthly.toString(),
        priceQuarterly: subscription.plan.priceQuarterly?.toString() ?? null,
        priceYearly: subscription.plan.priceYearly?.toString() ?? null,
        maxUsers: subscription.plan.maxUsers,
        maxProjects: subscription.plan.maxProjects,
        maxBeneficiaries: subscription.plan.maxBeneficiaries,
        storageGb: subscription.plan.storageGb,
        bandwidthGb: subscription.plan.bandwidthGb,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    const { id } = await params

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { organizationId: id },
      include: { plan: { select: { name: true } } },
    })

    if (!subscription) {
      return apiNotFound('No subscription found for this organization')
    }

    const body = await request.json()
    const { planId, status, billingCycle } = body

    const updateData: Record<string, unknown> = {}
    const auditDetails: Record<string, Prisma.InputJsonValue | undefined> = {
      organizationId: id,
      previousPlanId: subscription.planId,
      previousStatus: subscription.status,
      previousBillingCycle: subscription.billingCycle,
    }

    // If changing plan, schedule the change for end of current period
    if (planId && planId !== subscription.planId) {
      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      })

      if (!newPlan) {
        return apiBadRequest('Invalid plan ID')
      }

      if (!newPlan.isActive) {
        return apiBadRequest('Cannot switch to an inactive plan')
      }

      updateData.scheduledPlanId = planId
      updateData.scheduledChangeDate = subscription.currentPeriodEnd
      updateData.scheduledChangeType = 'PLAN_CHANGE'
      auditDetails.scheduledPlanId = planId
      auditDetails.scheduledPlanName = newPlan.name
      auditDetails.scheduledChangeDate = subscription.currentPeriodEnd
    }

    // If changing status, apply immediately
    if (status && status !== subscription.status) {
      const validStatuses = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']
      if (!validStatuses.includes(status)) {
        return apiBadRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      }

      updateData.status = status
      auditDetails.newStatus = status

      if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
      }

      if (status === 'SUSPENDED') {
        updateData.pausedAt = new Date()
      }
    }

    // If changing billing cycle, apply immediately
    if (billingCycle && billingCycle !== subscription.billingCycle) {
      const validCycles = ['MONTHLY', 'QUARTERLY', 'YEARLY']
      if (!validCycles.includes(billingCycle)) {
        return apiBadRequest(`Invalid billing cycle. Must be one of: ${validCycles.join(', ')}`)
      }

      updateData.billingCycle = billingCycle
      auditDetails.newBillingCycle = billingCycle
    }

    if (Object.keys(updateData).length === 0) {
      return apiBadRequest('No changes provided')
    }

    const updated = await prisma.tenantSubscription.update({
      where: { organizationId: id },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true } },
      },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'UPDATE_SUBSCRIPTION',
        entityType: 'TenantSubscription',
        entityId: updated.id,
        details: auditDetails,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
