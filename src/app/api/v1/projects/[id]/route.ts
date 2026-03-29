import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']
const VALID_TYPES = ['HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY']
const VALID_SECTORS = ['WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER']

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: {
        id: true,
        projectNo: true,
        name: true,
        description: true,
        projectType: true,
        sector: true,
        donorId: true,
        startDate: true,
        endDate: true,
        totalBudget: true,
        amountSpent: true,
        currency: true,
        country: true,
        region: true,
        location: true,
        implementingPartner: true,
        status: true,
        progress: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        grants: {
          where: { deletedAt: null },
          select: {
            id: true,
            grantNo: true,
            title: true,
            awardAmount: true,
            disbursedAmount: true,
            currencyCode: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        teamMembers: {
          where: { isActive: true },
          select: {
            id: true,
            role: true,
            startDate: true,
            endDate: true,
            allocation: true,
            employee: {
              select: {
                id: true,
                fullName: true,
                designation: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            activities: true,
            milestones: true,
            budgets: true,
            indicators: true,
            risks: true,
            logFrameEntries: true,
            documents: true,
          },
        },
      },
    })

    if (!project) return apiNotFound('Project not found')

    const budgetSummary = await prisma.budget.aggregate({
      where: { projectId: id, deletedAt: null },
      _sum: { totalAmount: true },
      _count: true,
    })

    return apiSuccess({
      ...project,
      budgetSummary: {
        totalBudgeted: budgetSummary._sum.totalAmount ?? 0,
        budgetCount: budgetSummary._count,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!existing) return apiNotFound('Project not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = body.name.trim()
    }

    if (body.description !== undefined) data.description = body.description || null
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.totalBudget !== undefined) data.totalBudget = new Prisma.Decimal(body.totalBudget)
    if (body.location !== undefined) data.location = body.location || null
    if (body.country !== undefined) data.country = body.country || null
    if (body.region !== undefined) data.region = body.region || null
    if (body.currency !== undefined) data.currency = body.currency || 'USD'
    if (body.implementingPartner !== undefined) data.implementingPartner = body.implementingPartner || null
    if (body.managerId !== undefined) data.managerId = body.managerId || null
    if (body.donorId !== undefined) data.donorId = body.donorId || null

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return apiBadRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`)
      }
      data.status = body.status
    }

    if (body.projectType !== undefined) {
      if (!VALID_TYPES.includes(body.projectType)) {
        return apiBadRequest(`projectType must be one of: ${VALID_TYPES.join(', ')}`)
      }
      data.projectType = body.projectType
    }

    if (body.sector !== undefined) {
      if (!VALID_SECTORS.includes(body.sector)) {
        return apiBadRequest(`sector must be one of: ${VALID_SECTORS.join(', ')}`)
      }
      data.sector = body.sector
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress)
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return apiBadRequest('Progress must be a number between 0 and 100')
      }
      data.progress = progress
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.project.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'project',
      resource: 'project',
      resourceId: id,
      description: `Updated project "${updated.name}"`,
      oldValues: { name: existing.name, status: existing.status, progress: existing.progress },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.project.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!existing) return apiNotFound('Project not found')

    if (existing.status !== 'PIPELINE') {
      return apiBadRequest('Only PIPELINE projects can be deleted')
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'project',
      resource: 'project',
      resourceId: id,
      description: `Deleted project "${existing.name}" (${existing.projectNo})`,
      oldValues: { name: existing.name, status: existing.status },
      ...auditCtx,
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
