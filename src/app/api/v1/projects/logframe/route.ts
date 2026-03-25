import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      return apiBadRequest('projectId is required')
    }

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Define level order for sorting
    const levelOrder = { GOAL: 0, PURPOSE: 1, OUTPUT: 2, ACTIVITY: 3 }

    const entries = await prisma.logFrameEntry.findMany({
      where: { projectId },
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
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    })

    // Sort by level then sortOrder
    const sorted = entries.sort((a, b) => {
      const levelDiff = (levelOrder[a.level as keyof typeof levelOrder] ?? 99) -
        (levelOrder[b.level as keyof typeof levelOrder] ?? 99)
      if (levelDiff !== 0) return levelDiff
      return a.sortOrder - b.sortOrder
    })

    return apiSuccess(sorted)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      projectId,
      level,
      narrative,
      indicators,
      meansOfVerification,
      assumptions,
      parentId,
      sortOrder,
    } = body

    if (!projectId || !level || !narrative) {
      return apiBadRequest('projectId, level, and narrative are required')
    }

    const validLevels = ['GOAL', 'PURPOSE', 'OUTPUT', 'ACTIVITY']
    if (!validLevels.includes(level)) {
      return apiBadRequest(`level must be one of: ${validLevels.join(', ')}`)
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, projectNo: true },
    })

    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Validate parent entry belongs to same project
    if (parentId) {
      const parentEntry = await prisma.logFrameEntry.findFirst({
        where: {
          id: parentId,
          projectId,
        },
      })
      if (!parentEntry) {
        return apiBadRequest('Parent entry not found in this project')
      }
    }

    // Auto-assign sortOrder if not provided
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const maxSort = await prisma.logFrameEntry.aggregate({
        where: { projectId, level },
        _max: { sortOrder: true },
      })
      finalSortOrder = (maxSort._max.sortOrder ?? -1) + 1
    }

    const entry = await prisma.logFrameEntry.create({
      data: {
        projectId,
        level,
        narrative: narrative.trim(),
        indicators: indicators || null,
        meansOfVerification: meansOfVerification || null,
        assumptions: assumptions || null,
        parentId: parentId || null,
        sortOrder: finalSortOrder,
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
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'project',
      resource: 'logframe_entry',
      resourceId: entry.id,
      description: `Created logframe ${level} entry for project ${project.projectNo}`,
      newValues: { level, narrative, projectId },
      ...auditCtx,
    })

    return apiCreated(entry)
  } catch (error) {
    return handleRouteError(error)
  }
}
