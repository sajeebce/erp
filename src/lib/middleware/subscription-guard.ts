import { prisma } from '@/lib/db'

export type AccessLevel = 'FULL' | 'READ_ONLY' | 'BLOCKED'

interface SubscriptionAccess {
  level: AccessLevel
  status: string
  message?: string
  daysUntilExpiry?: number
}

export async function checkSubscriptionAccess(organizationId: string): Promise<SubscriptionAccess> {
  const subscription = await prisma.tenantSubscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  })

  if (!subscription) {
    return { level: 'BLOCKED', status: 'NO_SUBSCRIPTION', message: 'No active subscription found' }
  }

  const now = new Date()

  switch (subscription.status) {
    case 'ACTIVE':
      return { level: 'FULL', status: 'ACTIVE' }

    case 'TRIAL': {
      if (subscription.trialEnd && now > subscription.trialEnd) {
        return { level: 'BLOCKED', status: 'TRIAL_EXPIRED', message: 'Trial period has ended. Please subscribe.' }
      }
      const daysLeft = subscription.trialEnd
        ? Math.ceil((subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return { level: 'FULL', status: 'TRIAL', daysUntilExpiry: daysLeft }
    }

    case 'PAST_DUE': {
      const graceDays = subscription.graceDays || 7
      const graceEnd = subscription.graceStartDate
        ? new Date(subscription.graceStartDate.getTime() + graceDays * 24 * 60 * 60 * 1000)
        : now
      if (now > graceEnd) {
        return { level: 'BLOCKED', status: 'GRACE_EXPIRED', message: 'Grace period ended. Payment required.' }
      }
      const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        level: 'READ_ONLY',
        status: 'PAST_DUE',
        message: `Payment overdue. ${daysLeft} days remaining before access is blocked.`,
        daysUntilExpiry: daysLeft,
      }
    }

    case 'PAUSED':
      return { level: 'READ_ONLY', status: 'PAUSED', message: 'Subscription is paused. Resume to regain full access.' }

    case 'EXPIRED':
      return { level: 'BLOCKED', status: 'EXPIRED', message: 'Subscription expired. Please renew.' }

    case 'CANCELLED':
      return { level: 'BLOCKED', status: 'CANCELLED', message: 'Subscription cancelled.' }

    default:
      return { level: 'BLOCKED', status: subscription.status, message: 'Unknown subscription status' }
  }
}

export async function requireWriteAccess(organizationId: string): Promise<void> {
  const access = await checkSubscriptionAccess(organizationId)
  if (access.level !== 'FULL') {
    throw new Error(`Access denied: ${access.message || 'Write access requires an active subscription'}`)
  }
}

export async function requireReadAccess(organizationId: string): Promise<void> {
  const access = await checkSubscriptionAccess(organizationId)
  if (access.level === 'BLOCKED') {
    throw new Error(`Access denied: ${access.message || 'Subscription required'}`)
  }
}
