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
      employee: { organizationId: auth.organizationId, deletedAt: null },
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) where.employeeId = employeeId

    const reviewPeriod = url.searchParams.get('reviewPeriod')
    if (reviewPeriod) where.reviewPeriod = reviewPeriod

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeNo: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.performanceReview.count({ where }),
    ])

    return apiPaginated(reviews, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, reviewPeriod, reviewType } = body

    if (!employeeId || !reviewPeriod || !reviewType) {
      return apiBadRequest('employeeId, reviewPeriod, and reviewType are required')
    }

    const validTypes = ['ANNUAL', 'MID_YEAR', 'PROBATION']
    if (!validTypes.includes(reviewType)) {
      return apiBadRequest(`reviewType must be one of: ${validTypes.join(', ')}`)
    }

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true, fullName: true },
    })
    if (!employee) {
      return apiBadRequest('Employee not found in this organization')
    }

    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewPeriod,
        reviewType,
        status: 'DRAFT',
        selfComments: body.selfComments || null,
        supervisorComments: body.supervisorComments || null,
        developmentPlan: body.developmentPlan || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'performance_review',
      resourceId: review.id,
      description: `Created ${reviewType} review for "${employee.fullName}" (${reviewPeriod})`,
      newValues: { employeeId, reviewPeriod, reviewType },
      ...auditCtx,
    })

    return apiCreated(review)
  } catch (error) {
    return handleRouteError(error)
  }
}
