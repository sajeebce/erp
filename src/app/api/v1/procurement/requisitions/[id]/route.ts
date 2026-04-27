import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiMessage,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function canAccessRequisition(
  requisition: { project: { organizationId: string } | null; requestedById: string },
  organizationId: string,
  userId: string
) {
  if (requisition.project?.organizationId === organizationId) {
    return true
  }

  if (requisition.requestedById === userId) {
    return true
  }

  const requester = await prisma.user.findFirst({
    where: {
      id: requisition.requestedById,
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  })

  return Boolean(requester)
}

async function findRequisition(id: string, organizationId: string, userId: string) {
  const requisition = await prisma.purchaseRequisition.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      project: { select: { organizationId: true } },
    },
  })

  if (!requisition) {
    return null
  }

  const allowed = await canAccessRequisition(requisition, organizationId, userId)
  return allowed ? requisition : null
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const basicRequisition = await findRequisition(id, auth.organizationId, auth.userId)

    if (!basicRequisition) {
      return apiNotFound('Purchase requisition not found')
    }

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!requisition) {
      return apiNotFound('Purchase requisition not found')
    }

    return apiSuccess(requisition)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await findRequisition(id, auth.organizationId, auth.userId)

    if (!existing) {
      return apiNotFound('Purchase requisition not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiForbidden('Only DRAFT requisitions can be updated')
    }

    const body = await request.json()
    const { date, departmentId, projectId, priority, justification, notes, lines } = body

    const data: Record<string, unknown> = {}
    if (date !== undefined) data.date = new Date(date)
    if (departmentId !== undefined) data.departmentId = departmentId || null
    if (projectId !== undefined) data.projectId = projectId || null
    if (priority !== undefined) data.priority = priority
    if (justification !== undefined) data.justification = justification || null
    if (notes !== undefined) data.notes = notes || null

    if (lines && Array.isArray(lines) && lines.length > 0) {
      // Delete old lines and recreate
      await prisma.purchaseRequisitionLine.deleteMany({ where: { prId: id } })

      const totalEstimate = lines.reduce(
        (sum: number, l: { quantity?: number; estimatedPrice?: number }) =>
          sum + (Number(l.quantity || 0) * Number(l.estimatedPrice || 0)),
        0
      )
      data.totalEstimate = new Prisma.Decimal(totalEstimate)

      data.lines = {
        create: lines.map(
          (
            l: { description: string; specification?: string; unit: string; quantity: number; estimatedPrice: number },
            i: number
          ) => ({
            description: l.description,
            specification: l.specification || null,
            unit: l.unit,
            quantity: new Prisma.Decimal(l.quantity),
            estimatedPrice: new Prisma.Decimal(l.estimatedPrice),
            totalEstimate: new Prisma.Decimal(Number(l.quantity) * Number(l.estimatedPrice)),
            sortOrder: i,
          })
        ),
      }
    }

    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data,
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await findRequisition(id, auth.organizationId, auth.userId)

    if (!existing) {
      return apiNotFound('Purchase requisition not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiForbidden('Only DRAFT requisitions can be deleted')
    }

    await prisma.purchaseRequisition.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: `Deleted purchase requisition ${existing.prNo}`,
      ...audit,
    })

    return apiMessage('Purchase requisition deleted')
  } catch (error) {
    return handleRouteError(error)
  }
}
