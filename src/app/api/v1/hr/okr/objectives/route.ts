import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const cycleId = url.searchParams.get('cycleId')
    if (cycleId) where.cycleId = cycleId

    const ownerType = url.searchParams.get('ownerType')
    if (ownerType) where.ownerType = ownerType

    const ownerId = url.searchParams.get('ownerId')
    if (ownerId) where.ownerId = ownerId

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const parentObjectiveId = url.searchParams.get('parentObjectiveId')
    if (parentObjectiveId) where.parentObjectiveId = parentObjectiveId

    const [objectives, total] = await Promise.all([
      prisma.oKRObjective.findMany({
        where,
        include: {
          keyResults: true,
          cycle: { select: { id: true, name: true, status: true } },
          _count: { select: { childObjectives: true, scores: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.oKRObjective.count({ where }),
    ])

    return apiPaginated(objectives, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { cycleId, ownerType, ownerId, title, keyResults } = body

    if (!cycleId || !ownerType || !ownerId || !title) {
      return apiBadRequest('cycleId, ownerType, ownerId, and title are required')
    }

    const validOwnerTypes = ['ORGANIZATION', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL']
    if (!validOwnerTypes.includes(ownerType)) {
      return apiBadRequest(`ownerType must be one of: ${validOwnerTypes.join(', ')}`)
    }

    // Validate cycle belongs to org
    const cycle = await prisma.oKRCycle.findFirst({
      where: { id: cycleId, organizationId: auth.organizationId },
    })
    if (!cycle) {
      return apiBadRequest('OKR cycle not found in this organization')
    }

    // Validate parent objective if provided
    if (body.parentObjectiveId) {
      const parent = await prisma.oKRObjective.findFirst({
        where: { id: body.parentObjectiveId, organizationId: auth.organizationId },
      })
      if (!parent) {
        return apiBadRequest('Parent objective not found in this organization')
      }
    }

    // Build key results create array
    const keyResultsData =
      keyResults && Array.isArray(keyResults)
        ? keyResults.map(
            (kr: {
              title: string
              description?: string
              resultType: string
              startValue?: number
              targetValue: number
              unit?: string
              dueDate?: string
            }) => ({
              title: kr.title,
              description: kr.description || null,
              resultType: kr.resultType as 'METRIC' | 'MILESTONE' | 'PERCENTAGE',
              startValue: new Prisma.Decimal(kr.startValue ?? 0),
              targetValue: new Prisma.Decimal(kr.targetValue),
              currentValue: new Prisma.Decimal(kr.startValue ?? 0),
              unit: kr.unit || null,
              dueDate: kr.dueDate ? new Date(kr.dueDate) : null,
            })
          )
        : []

    const objective = await prisma.oKRObjective.create({
      data: {
        organizationId: auth.organizationId,
        cycleId,
        ownerType,
        ownerId,
        parentObjectiveId: body.parentObjectiveId || null,
        title,
        description: body.description || null,
        weight: body.weight ? new Prisma.Decimal(body.weight) : new Prisma.Decimal(1),
        createdById: auth.userId,
        keyResults: {
          create: keyResultsData,
        },
      },
      include: {
        keyResults: true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'okr_objective',
      resourceId: objective.id,
      description: `Created OKR objective "${title}" (${ownerType}) with ${keyResultsData.length} key results`,
      newValues: { cycleId, ownerType, ownerId, title, keyResultCount: keyResultsData.length },
      ...auditCtx,
    })

    return apiCreated(objective)
  } catch (error) {
    return handleRouteError(error)
  }
}
