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

    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        select: {
          id: true,
          milestoneNo: true,
          description: true,
          projectId: true,
          targetDate: true,
          actualDate: true,
          deliverable: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { targetDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.milestone.count({ where }),
    ])

    return apiPaginated(milestones, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { description, projectId, targetDate, deliverable } = body

    if (!description || !projectId || !targetDate) {
      return apiBadRequest('description, projectId, and targetDate are required')
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

    // Auto-generate milestoneNo: {projectNo}-M{count+1 padded to 2}
    const milestoneCount = await prisma.milestone.count({
      where: { projectId },
    })
    const milestoneNo = `${project.projectNo}-M${String(milestoneCount + 1).padStart(2, '0')}`

    const milestone = await prisma.milestone.create({
      data: {
        milestoneNo,
        description: description.trim(),
        projectId,
        targetDate: new Date(targetDate),
        deliverable: deliverable || null,
        status: 'ON_TRACK',
      },
      select: {
        id: true,
        milestoneNo: true,
        description: true,
        projectId: true,
        targetDate: true,
        actualDate: true,
        deliverable: true,
        status: true,
        notes: true,
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
      resource: 'milestone',
      resourceId: milestone.id,
      description: `Created milestone "${description}" (${milestoneNo}) for project ${project.projectNo}`,
      newValues: { description, milestoneNo, projectId, targetDate },
      ...auditCtx,
    })

    return apiCreated(milestone)
  } catch (error) {
    return handleRouteError(error)
  }
}
