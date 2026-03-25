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

interface RouteParams {
  params: Promise<{ id: string }>
}

const LIFECYCLE_ORDER = [
  'IDENTIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'AGREEMENT',
  'IMPLEMENTATION',
  'CLOSEOUT',
] as const

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const grant = await prisma.grant.findFirst({
      where: {
        id,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: {
        id: true,
        grantNo: true,
        title: true,
        lifecycleStage: true,
      },
    })

    if (!grant) {
      return apiNotFound('Grant not found')
    }

    const body = await request.json()
    const { stage } = body

    if (!stage) {
      return apiBadRequest('stage is required')
    }

    if (!LIFECYCLE_ORDER.includes(stage)) {
      return apiBadRequest(
        `stage must be one of: ${LIFECYCLE_ORDER.join(', ')}`
      )
    }

    // Validate stage progression — can only move forward or stay same
    const currentIndex = LIFECYCLE_ORDER.indexOf(
      grant.lifecycleStage as (typeof LIFECYCLE_ORDER)[number]
    )
    const newIndex = LIFECYCLE_ORDER.indexOf(stage)

    if (newIndex < currentIndex) {
      return apiBadRequest(
        `Cannot move lifecycle stage backward from ${grant.lifecycleStage} to ${stage}. ` +
          `Allowed stages: ${LIFECYCLE_ORDER.slice(currentIndex).join(', ')}`
      )
    }

    const oldStage = grant.lifecycleStage

    const updated = await prisma.grant.update({
      where: { id },
      data: { lifecycleStage: stage },
      select: {
        id: true,
        grantNo: true,
        title: true,
        lifecycleStage: true,
        status: true,
        updatedAt: true,
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'donor',
      resource: 'grant',
      resourceId: id,
      description: `Updated grant "${grant.title}" (${grant.grantNo}) lifecycle stage from ${oldStage} to ${stage}`,
      oldValues: { lifecycleStage: oldStage },
      newValues: { lifecycleStage: stage },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
