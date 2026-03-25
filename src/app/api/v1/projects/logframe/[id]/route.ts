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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const entry = await prisma.logFrameEntry.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        projectId: true,
        level: true,
        narrative: true,
        indicators: true,
        meansOfVerification: true,
        assumptions: true,
        sortOrder: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        children: {
          select: {
            id: true,
            level: true,
            narrative: true,
            indicators: true,
            meansOfVerification: true,
            assumptions: true,
            sortOrder: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!entry) {
      return apiNotFound('Log frame entry not found')
    }

    return apiSuccess(entry)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.logFrameEntry.findFirst({
      where: {
        id,
        project: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        level: true,
        narrative: true,
        projectId: true,
      },
    })

    if (!existing) {
      return apiNotFound('Log frame entry not found')
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (body.level !== undefined) {
      const validLevels = ['GOAL', 'PURPOSE', 'OUTPUT', 'ACTIVITY']
      if (!validLevels.includes(body.level)) {
        return apiBadRequest(`level must be one of: ${validLevels.join(', ')}`)
      }
      data.level = body.level
    }

    if (body.narrative !== undefined) {
      if (typeof body.narrative !== 'string' || body.narrative.trim().length === 0) {
        return apiBadRequest('Narrative must be a non-empty string')
      }
      data.narrative = body.narrative.trim()
    }

    if (body.indicators !== undefined) {
      data.indicators = body.indicators || null
    }

    if (body.meansOfVerification !== undefined) {
      data.meansOfVerification = body.meansOfVerification || null
    }

    if (body.assumptions !== undefined) {
      data.assumptions = body.assumptions || null
    }

    if (body.parentId !== undefined) {
      data.parentId = body.parentId || null
    }

    if (body.sortOrder !== undefined) {
      data.sortOrder = body.sortOrder
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.logFrameEntry.update({
      where: { id },
      data,
      select: {
        id: true,
        projectId: true,
        level: true,
        narrative: true,
        indicators: true,
        meansOfVerification: true,
        assumptions: true,
        sortOrder: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'project',
      resource: 'logframe_entry',
      resourceId: id,
      description: `Updated logframe ${updated.level} entry`,
      oldValues: {
        level: existing.level,
        narrative: existing.narrative,
      },
      newValues: data,
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
