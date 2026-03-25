import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search } = parsePaginationParams(url)

    // Tenant scope: only rules that have entries linked to org's projects
    // Since CostAllocationRule has no organizationId, we filter by entries.project.organizationId
    const where: Record<string, unknown> = {
      entries: {
        some: {
          project: { organizationId: auth.organizationId },
        },
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const isActive = url.searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [rules, total] = await Promise.all([
      prisma.costAllocationRule.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          totalAmount: true,
          isActive: true,
          frequency: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { entries: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.costAllocationRule.count({ where }),
    ])

    return apiPaginated(rules, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { name, description, totalAmount, frequency } = body

    if (!name || totalAmount === undefined) {
      return apiBadRequest('name and totalAmount are required')
    }

    if (Number(totalAmount) <= 0) {
      return apiBadRequest('totalAmount must be greater than 0')
    }

    const validFrequencies = ['MONTHLY', 'QUARTERLY', 'ANNUALLY']
    if (frequency && !validFrequencies.includes(frequency)) {
      return apiBadRequest(`frequency must be one of: ${validFrequencies.join(', ')}`)
    }

    const rule = await prisma.costAllocationRule.create({
      data: {
        name: name.trim(),
        description: description || null,
        totalAmount: new Prisma.Decimal(totalAmount),
        frequency: frequency || 'MONTHLY',
      },
      select: {
        id: true,
        name: true,
        description: true,
        totalAmount: true,
        isActive: true,
        frequency: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'budget',
      resource: 'cost_allocation_rule',
      resourceId: rule.id,
      description: `Created cost allocation rule "${name}"`,
      newValues: { name, totalAmount, frequency: frequency || 'MONTHLY' },
      ...auditCtx,
    })

    return apiCreated(rule)
  } catch (error) {
    return handleRouteError(error)
  }
}
