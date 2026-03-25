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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const review = await prisma.performanceReview.findFirst({
      where: { id, employee: { organizationId: auth.organizationId } },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
      },
    })

    if (!review) {
      return apiNotFound('Performance review not found')
    }

    return apiSuccess(review)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.performanceReview.findFirst({
      where: { id, employee: { organizationId: auth.organizationId } },
    })
    if (!existing) {
      return apiNotFound('Performance review not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.selfScore !== undefined) data.selfScore = new Prisma.Decimal(body.selfScore)
    if (body.supervisorScore !== undefined) data.supervisorScore = new Prisma.Decimal(body.supervisorScore)
    if (body.selfComments !== undefined) data.selfComments = body.selfComments || null
    if (body.supervisorComments !== undefined) data.supervisorComments = body.supervisorComments || null
    if (body.developmentPlan !== undefined) data.developmentPlan = body.developmentPlan || null
    if (body.status !== undefined) data.status = body.status
    if (body.reviewedById !== undefined) data.reviewedById = body.reviewedById

    // Calculate finalScore if both scores are available
    const selfScore = body.selfScore ?? (existing.selfScore ? Number(existing.selfScore) : null)
    const supervisorScore = body.supervisorScore ?? (existing.supervisorScore ? Number(existing.supervisorScore) : null)

    if (selfScore !== null && supervisorScore !== null) {
      const finalScore = Math.round(((selfScore + supervisorScore) / 2) * 10) / 10
      data.finalScore = new Prisma.Decimal(finalScore)

      // Assign rating based on finalScore
      if (finalScore >= 4.5) data.rating = 'OUTSTANDING'
      else if (finalScore >= 3.5) data.rating = 'EXCEEDS_EXPECTATIONS'
      else if (finalScore >= 2.5) data.rating = 'MEETS_EXPECTATIONS'
      else if (finalScore >= 1.5) data.rating = 'BELOW_EXPECTATIONS'
      else data.rating = 'UNSATISFACTORY'
    }

    if (body.status === 'COMPLETED') {
      data.completedAt = new Date()
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.performanceReview.update({ where: { id }, data })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'performance_review',
      resourceId: id,
      description: `Updated performance review for period ${existing.reviewPeriod}`,
      oldValues: { status: existing.status, finalScore: existing.finalScore },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
