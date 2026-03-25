import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
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
    await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {}

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const type = url.searchParams.get('type')
    if (type) where.type = type

    const [trainings, total] = await Promise.all([
      prisma.training.findMany({
        where,
        select: {
          id: true,
          trainingNo: true,
          title: true,
          type: true,
          facilitator: true,
          venue: true,
          startDate: true,
          endDate: true,
          durationHours: true,
          budget: true,
          actualCost: true,
          status: true,
          createdAt: true,
          _count: { select: { participants: true } },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.training.count({ where }),
    ])

    return apiPaginated(trainings, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { title, type, startDate } = body

    if (!title || !type || !startDate) {
      return apiBadRequest('title, type, and startDate are required')
    }

    const validTypes = ['INTERNAL', 'EXTERNAL', 'ONLINE']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    const trainingNo = await generateNextNumber(auth.organizationId, 'training')

    const training = await prisma.training.create({
      data: {
        trainingNo,
        title: title.trim(),
        type,
        facilitator: body.facilitator || null,
        venue: body.venue || null,
        startDate: new Date(startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        durationHours: body.durationHours || null,
        budget: body.budget ? new Prisma.Decimal(body.budget) : new Prisma.Decimal(0),
        status: 'PLANNED',
        description: body.description || null,
        projectId: body.projectId || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'training',
      resourceId: training.id,
      description: `Created training "${title}" (${trainingNo})`,
      newValues: { trainingNo, title, type },
      ...auditCtx,
    })

    return apiCreated(training)
  } catch (error) {
    return handleRouteError(error)
  }
}
