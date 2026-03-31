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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const cycleType = url.searchParams.get('cycleType')
    if (cycleType) where.cycleType = cycleType

    const [cycles, total] = await Promise.all([
      prisma.oKRCycle.findMany({
        where,
        include: {
          _count: { select: { objectives: true } },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.oKRCycle.count({ where }),
    ])

    return apiPaginated(cycles, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, cycleType, startDate, endDate, checkInFrequency } = body

    if (!name || !cycleType || !startDate || !endDate) {
      return apiBadRequest('name, cycleType, startDate, and endDate are required')
    }

    const validCycleTypes = ['QUARTERLY', 'ANNUAL']
    if (!validCycleTypes.includes(cycleType)) {
      return apiBadRequest(`cycleType must be one of: ${validCycleTypes.join(', ')}`)
    }

    const parsedStart = new Date(startDate)
    const parsedEnd = new Date(endDate)
    if (parsedEnd <= parsedStart) {
      return apiBadRequest('endDate must be after startDate')
    }

    const validFrequencies = ['WEEKLY', 'BIWEEKLY', 'MONTHLY']
    if (checkInFrequency && !validFrequencies.includes(checkInFrequency)) {
      return apiBadRequest(`checkInFrequency must be one of: ${validFrequencies.join(', ')}`)
    }

    const cycle = await prisma.oKRCycle.create({
      data: {
        organizationId: auth.organizationId,
        name,
        cycleType,
        startDate: parsedStart,
        endDate: parsedEnd,
        checkInFrequency: checkInFrequency || 'BIWEEKLY',
        createdById: auth.userId,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'okr_cycle',
      resourceId: cycle.id,
      description: `Created OKR cycle "${name}" (${cycleType})`,
      newValues: { name, cycleType, startDate, endDate },
      ...auditCtx,
    })

    return apiCreated(cycle)
  } catch (error) {
    return handleRouteError(error)
  }
}
