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
    const { page, limit, skip } = parsePaginationParams(url)

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

    const where: Record<string, unknown> = {
      projectId,
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const responsibleId = url.searchParams.get('responsibleId')
    if (responsibleId) {
      where.responsibleId = responsibleId
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          activityNo: true,
          name: true,
          description: true,
          projectId: true,
          responsibleId: true,
          startDate: true,
          endDate: true,
          budget: true,
          actualCost: true,
          progress: true,
          status: true,
          parentId: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { children: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ])

    return apiPaginated(activities, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      description,
      projectId,
      responsibleId,
      startDate,
      endDate,
      budget,
      parentId,
      sortOrder,
    } = body

    if (!name || !projectId) {
      return apiBadRequest('name and projectId are required')
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

    // Validate parent activity belongs to same project
    if (parentId) {
      const parentActivity = await prisma.activity.findFirst({
        where: {
          id: parentId,
          projectId,
        },
      })
      if (!parentActivity) {
        return apiBadRequest('Parent activity not found in this project')
      }
    }

    // Auto-generate activityNo: {projectNo}-A{count+1 padded to 3}
    const activityCount = await prisma.activity.count({
      where: { projectId },
    })
    const activityNo = `${project.projectNo}-A${String(activityCount + 1).padStart(3, '0')}`

    const activity = await prisma.activity.create({
      data: {
        activityNo,
        name: name.trim(),
        description: description || null,
        projectId,
        responsibleId: responsibleId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? new Prisma.Decimal(budget) : new Prisma.Decimal(0),
        status: 'PLANNED',
        parentId: parentId || null,
        sortOrder: sortOrder ?? activityCount,
      },
      select: {
        id: true,
        activityNo: true,
        name: true,
        description: true,
        projectId: true,
        responsibleId: true,
        startDate: true,
        endDate: true,
        budget: true,
        actualCost: true,
        progress: true,
        status: true,
        parentId: true,
        sortOrder: true,
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
      resource: 'activity',
      resourceId: activity.id,
      description: `Created activity "${name}" (${activityNo}) for project ${project.projectNo}`,
      newValues: { name, activityNo, projectId, budget },
      ...auditCtx,
    })

    return apiCreated(activity)
  } catch (error) {
    return handleRouteError(error)
  }
}
