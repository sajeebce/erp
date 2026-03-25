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

    const closeout = await prisma.projectCloseout.findFirst({
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

    if (!closeout) {
      return apiNotFound('Closeout not found')
    }

    return apiSuccess(closeout)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Verify closeout exists and belongs to org
    const closeout = await prisma.projectCloseout.findFirst({
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
        project: { select: { name: true, projectNo: true } },
      },
    })

    if (!closeout) {
      return apiNotFound('Closeout not found')
    }

    const body = await request.json()
    const { itemId, status, notes } = body

    if (!itemId || !status) {
      return apiBadRequest('itemId and status are required')
    }

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
    }

    // Verify the item belongs to this closeout
    const item = await prisma.projectCloseoutItem.findFirst({
      where: {
        id: itemId,
        closeoutId: id,
      },
      select: { id: true, name: true, status: true },
    })

    if (!item) {
      return apiBadRequest('Closeout item not found in this closeout')
    }

    // Update item
    const itemData: Record<string, unknown> = {
      status,
    }

    if (notes !== undefined) {
      itemData.notes = notes || null
    }

    // If status is COMPLETED, set completedAt to now
    if (status === 'COMPLETED') {
      itemData.completedAt = new Date()
    } else {
      itemData.completedAt = null
    }

    await prisma.projectCloseoutItem.update({
      where: { id: itemId },
      data: itemData,
    })

    // Recalculate closeout progress
    const allItems = await prisma.projectCloseoutItem.findMany({
      where: { closeoutId: id },
      select: { status: true },
    })

    const totalItems = allItems.length
    const completedItems = allItems.filter((i) => i.status === 'COMPLETED').length
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    // Update closeout progress
    const closeoutData: Record<string, unknown> = { progress }
    if (progress === 100) {
      closeoutData.completedAt = new Date()
    } else {
      closeoutData.completedAt = null
    }

    await prisma.projectCloseout.update({
      where: { id },
      data: closeoutData,
    })

    // Fetch the updated closeout with all items
    const updatedCloseout = await prisma.projectCloseout.findUnique({
      where: { id },
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
      action: 'UPDATE',
      module: 'project',
      resource: 'project_closeout_item',
      resourceId: itemId,
      description: `Updated closeout item "${item.name}" to ${status} for project "${closeout.project.name}"`,
      oldValues: { status: item.status },
      newValues: { status, notes, closeoutProgress: progress },
      ...auditCtx,
    })

    return apiSuccess(updatedCloseout)
  } catch (error) {
    return handleRouteError(error)
  }
}
