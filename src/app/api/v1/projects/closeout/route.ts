import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

const DEFAULT_CHECKLIST_ITEMS = [
  'Final Financial Report',
  'Final Narrative Report',
  'Asset Disposition Plan',
  'Lessons Learned Document',
  'Donor Acknowledgement',
  'Staff Transition Plan',
  'Data Archival',
  'Final Audit',
]

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      project: {
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const [closeouts, total] = await Promise.all([
      prisma.projectCloseout.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          startDate: true,
          completedAt: true,
          progress: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              projectNo: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.projectCloseout.count({ where }),
    ])

    return apiPaginated(closeouts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return apiBadRequest('projectId is required')
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, projectNo: true, name: true },
    })

    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Check no existing closeout for this project
    const existingCloseout = await prisma.projectCloseout.findUnique({
      where: { projectId },
    })

    if (existingCloseout) {
      return apiConflict('A closeout already exists for this project')
    }

    // Create closeout with default checklist items
    const closeout = await prisma.projectCloseout.create({
      data: {
        projectId,
        startDate: new Date(),
        progress: 0,
        items: {
          create: DEFAULT_CHECKLIST_ITEMS.map((name, index) => ({
            name,
            status: 'NOT_STARTED',
            sortOrder: index,
          })),
        },
      },
      select: {
        id: true,
        projectId: true,
        startDate: true,
        completedAt: true,
        progress: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            name: true,
            status: true,
            assigneeId: true,
            dueDate: true,
            completedAt: true,
            notes: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'project',
      resource: 'project_closeout',
      resourceId: closeout.id,
      description: `Created closeout for project "${project.name}" (${project.projectNo})`,
      newValues: { projectId, itemCount: DEFAULT_CHECKLIST_ITEMS.length },
      ...auditCtx,
    })

    return apiCreated(closeout)
  } catch (error) {
    return handleRouteError(error)
  }
}
