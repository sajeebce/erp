import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth/session'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)
    void session

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: { select: { features: true, subscriptions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const data = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly.toString(),
      priceQuarterly: plan.priceQuarterly?.toString() ?? null,
      priceYearly: plan.priceYearly?.toString() ?? null,
      maxUsers: plan.maxUsers,
      maxProjects: plan.maxProjects,
      maxBeneficiaries: plan.maxBeneficiaries,
      storageGb: plan.storageGb,
      bandwidthGb: plan.bandwidthGb,
      trialDays: plan.trialDays,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      featureCount: plan._count.features,
      subscriptionCount: plan._count.subscriptions,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

const REQUIRED_FIELDS = [
  'name',
  'priceMonthly',
  'maxUsers',
  'maxProjects',
  'maxBeneficiaries',
  'storageGb',
  'bandwidthGb',
  'trialDays',
] as const

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdminFromRequest(request)

    const body = await request.json()

    const missing = REQUIRED_FIELDS.filter((f) => body[f] === undefined || body[f] === null)
    if (missing.length > 0) {
      return apiBadRequest(`Missing required fields: ${missing.join(', ')}`)
    }

    const {
      name,
      description,
      priceMonthly,
      priceQuarterly,
      priceYearly,
      maxUsers,
      maxProjects,
      maxBeneficiaries,
      storageGb,
      bandwidthGb,
      trialDays,
      sortOrder,
    } = body

    if (typeof name !== 'string' || name.trim().length < 2) {
      return apiBadRequest('Plan name must be at least 2 characters')
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return apiConflict('A plan with this name already exists')
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: description || null,
        priceMonthly,
        priceQuarterly: priceQuarterly ?? null,
        priceYearly: priceYearly ?? null,
        maxUsers,
        maxProjects,
        maxBeneficiaries,
        storageGb,
        bandwidthGb,
        trialDays,
        sortOrder: sortOrder ?? 0,
      },
    })

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.superAdminId,
        action: 'CREATE_PLAN',
        entityType: 'SubscriptionPlan',
        entityId: plan.id,
        details: { name: plan.name },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return apiCreated(plan)
  } catch (error) {
    return handleRouteError(error)
  }
}
