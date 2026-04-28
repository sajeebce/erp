import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiMessage,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'
import { resolveProcurementLineClassifications } from '@/lib/procurement-line-classification'

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

    return apiSuccess({
      ...requisition,
      budgetWarning: requisition.budgetWarningMessage,
    })
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

    if (existing.status !== 'DRAFT' && existing.status !== 'RETURNED') {
      return apiForbidden('Only DRAFT or RETURNED requisitions can be updated')
    }

    const body = await request.json()
    const {
      date,
      departmentId,
      projectId,
      businessUnitId,
      costCenterId,
      fundClassId,
      budgetId,
      priority,
      justification,
      notes,
      lines,
    } = body

    const data: Record<string, unknown> = {}
    if (date !== undefined) data.date = new Date(date)
    if (departmentId !== undefined) data.departmentId = departmentId || null
    if (projectId !== undefined) data.projectId = projectId || null
    if (businessUnitId !== undefined) data.businessUnitId = businessUnitId || null
    if (costCenterId !== undefined) data.costCenterId = costCenterId || null
    if (fundClassId !== undefined) data.fundClassId = fundClassId || null
    if (budgetId !== undefined) data.budgetId = budgetId || null
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
      const lineClassifications = await resolveProcurementLineClassifications(auth.organizationId, lines)

      data.lines = {
        create: lines.map(
          (
            l: {
              description: string
              specification?: string
              itemType?: string
              inventoryItemId?: string
              warehouseId?: string
              assetCategoryId?: string
              accountId?: string
              budgetLineId?: string
              businessUnitId?: string
              costCenterId?: string
              fundClassId?: string
              projectId?: string
              grantId?: string
              unit: string
              quantity: number
              estimatedPrice: number
            },
            i: number
          ) => {
            const classification = lineClassifications[i]

            return {
              description: l.description,
              specification: l.specification || null,
              itemType: classification.itemType,
              inventoryItemId: classification.inventoryItemId,
              warehouseId: classification.warehouseId,
              assetCategoryId: classification.assetCategoryId,
              accountId: classification.accountId || l.accountId || null,
              budgetLineId: l.budgetLineId || null,
              businessUnitId: l.businessUnitId || businessUnitId || existing.businessUnitId || null,
              costCenterId: l.costCenterId || costCenterId || existing.costCenterId || null,
              fundClassId: l.fundClassId || fundClassId || existing.fundClassId || null,
              projectId: l.projectId || projectId || existing.projectId || null,
              grantId: l.grantId || null,
              unit: l.unit,
              quantity: new Prisma.Decimal(l.quantity),
              estimatedPrice: new Prisma.Decimal(l.estimatedPrice),
              totalEstimate: new Prisma.Decimal(Number(l.quantity) * Number(l.estimatedPrice)),
              sortOrder: i,
            }
          }
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

    const linkedPo = await prisma.purchaseOrder.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(existing.linkedPOId ? [{ id: existing.linkedPOId }] : []),
          { lines: { some: { prLine: { prId: id } } } },
        ],
      },
      select: { poNo: true },
    })

    if (linkedPo || existing.linkedPOId) {
      return apiForbidden(
        linkedPo
          ? `Cannot delete requisition with linked purchase order ${linkedPo.poNo}`
          : 'Cannot delete requisition with linked purchase order'
      )
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
      oldValues: {
        prNo: existing.prNo,
        status: existing.status,
        totalEstimate: existing.totalEstimate.toString(),
      },
      ...audit,
    })

    return apiMessage('Purchase requisition deleted')
  } catch (error) {
    return handleRouteError(error)
  }
}
