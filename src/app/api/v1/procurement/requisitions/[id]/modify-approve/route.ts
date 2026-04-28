import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { apiSuccess, apiBadRequest, apiNotFound, apiForbidden, handleRouteError } from '@/lib/api-response'
import { Prisma } from '@prisma/client'
import { checkProcurementBudget } from '@/lib/procurement-budget'
import { DEFAULT_PR_WORKFLOW_NAME, processApproval, startApproval } from '@/lib/approval-engine'
import { resolveProcurementLineClassifications } from '@/lib/procurement-line-classification'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface ModifyLineInput {
  id?: string
  description: string
  specification?: string | null
  itemType?: string | null
  inventoryItemId?: string | null
  warehouseId?: string | null
  assetCategoryId?: string | null
  accountId?: string | null
  unit: string
  quantity: number
  estimatedPrice: number
}

async function requisitionBelongsToOrg(
  requisition: { project: { organizationId: string } | null; requestedById: string },
  organizationId: string
) {
  if (requisition.project?.organizationId === organizationId) return true

  const requester = await prisma.user.findFirst({
    where: { id: requisition.requestedById, organizationId, deletedAt: null },
    select: { id: true },
  })

  return Boolean(requester)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params
    const body = await request.json()
    const modificationNote = typeof body.modificationNote === 'string' ? body.modificationNote.trim() : ''
    const approvalNote = typeof body.approvalNote === 'string' ? body.approvalNote.trim() : ''
    const lines = Array.isArray(body.lines) ? (body.lines as ModifyLineInput[]) : null

    if (!modificationNote) return apiBadRequest('modificationNote is required')
    if (!lines || lines.length === 0) return apiBadRequest('At least one line item is required')

    for (const line of lines) {
      if (!line.description?.trim()) return apiBadRequest('Each line requires a description')
      if (!line.unit?.trim()) return apiBadRequest('Each line requires a unit')
      if (Number(line.quantity) <= 0) return apiBadRequest('Each line quantity must be greater than 0')
      if (Number(line.estimatedPrice) <= 0) return apiBadRequest('Each line estimated price must be greater than 0')
    }

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { organizationId: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!requisition) return apiNotFound('Purchase requisition not found')

    const belongsToOrg = await requisitionBelongsToOrg(requisition, auth.organizationId)
    if (!belongsToOrg) return apiNotFound('Purchase requisition not found')

    if (requisition.status !== 'SUBMITTED' && requisition.status !== 'REVIEWED') {
      return apiForbidden(`Only SUBMITTED or REVIEWED requisitions can be modified and approved. Current status: ${requisition.status}`)
    }

    const oldValues = {
      status: requisition.status,
      totalEstimate: requisition.totalEstimate.toString(),
      lines: requisition.lines.map((line) => ({
        id: line.id,
        description: line.description,
        specification: line.specification,
        unit: line.unit,
        quantity: line.quantity.toString(),
        estimatedPrice: line.estimatedPrice.toString(),
        totalEstimate: line.totalEstimate.toString(),
      })),
    }

    const existingLineById = new Map(requisition.lines.map((line) => [line.id, line]))
    for (const line of lines) {
      if (line.id && !existingLineById.has(line.id)) {
        return apiBadRequest(`Line ${line.id} does not belong to this purchase requisition`)
      }
    }

    const totalEstimate = lines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.estimatedPrice),
      0
    )

    const budgetCheck = await checkProcurementBudget({
      organizationId: auth.organizationId,
      requisitionId: requisition.id,
      budgetId: requisition.budgetId,
      businessUnitId: requisition.businessUnitId,
      costCenterId: requisition.costCenterId,
      fundClassId: requisition.fundClassId,
      projectId: requisition.projectId,
      totalEstimate,
    })
    const lineClassifications = await resolveProcurementLineClassifications(
      auth.organizationId,
      lines.map((line) => {
        const previous = line.id ? existingLineById.get(line.id) : undefined

        return {
          itemType: line.itemType || previous?.itemType || 'SERVICE_OR_EXPENSE',
          inventoryItemId: line.inventoryItemId || previous?.inventoryItemId || null,
          warehouseId: line.warehouseId || previous?.warehouseId || null,
          assetCategoryId: line.assetCategoryId || previous?.assetCategoryId || null,
          accountId: line.accountId || previous?.accountId || null,
        }
      })
    )

    const approval = await startApproval({
      organizationId: auth.organizationId,
      workflowName: DEFAULT_PR_WORKFLOW_NAME,
      entityType: 'PURCHASE_REQUISITION',
      entityId: requisition.id,
      requestedById: requisition.requestedById,
      amount: totalEstimate,
    })
    const approvalResult = await processApproval(
      approval.instanceId,
      auth.userId,
      'APPROVE',
      approvalNote || modificationNote
    )
    const isFinalApproval = approvalResult.isComplete && approvalResult.status === 'APPROVED'
    const now = new Date()
    const updated = await prisma.$transaction(async (tx) => {
      await tx.purchaseRequisitionLine.deleteMany({ where: { prId: id } })

      return tx.purchaseRequisition.update({
        where: { id },
        data: {
          status: isFinalApproval ? 'APPROVED' : 'REVIEWED',
          totalEstimate: new Prisma.Decimal(totalEstimate),
          approvedById: isFinalApproval ? auth.userId : null,
          approvedAt: isFinalApproval ? now : null,
          approvalNote: isFinalApproval ? approvalNote || null : null,
          modifiedById: auth.userId,
          modifiedAt: now,
          modifiedApprovalNote: modificationNote,
          budgetId: budgetCheck.budgetId || requisition.budgetId,
          budgetCheckStatus: budgetCheck.status,
          budgetWarningMessage: budgetCheck.message,
          budgetCheckedAt: now,
          approvedWithBudgetWarning: isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET'),
          warningApprovedById:
            isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET') ? auth.userId : null,
          warningApprovedAt:
            isFinalApproval && (budgetCheck.status === 'WARNING' || budgetCheck.status === 'NO_BUDGET') ? now : null,
          lines: {
            create: lines.map((line, index) => {
              const previous = line.id ? existingLineById.get(line.id) : undefined
              const classification = lineClassifications[index]
              const lineTotal = Number(line.quantity) * Number(line.estimatedPrice)

              return {
                description: line.description.trim(),
                specification: line.specification || null,
                itemType: classification.itemType,
                inventoryItemId: classification.inventoryItemId,
                warehouseId: classification.warehouseId,
                assetCategoryId: classification.assetCategoryId,
                accountId: classification.accountId || previous?.accountId || null,
                budgetLineId: previous?.budgetLineId || null,
                businessUnitId: previous?.businessUnitId || requisition.businessUnitId || null,
                costCenterId: previous?.costCenterId || requisition.costCenterId || null,
                fundClassId: previous?.fundClassId || requisition.fundClassId || null,
                projectId: previous?.projectId || requisition.projectId || null,
                grantId: previous?.grantId || null,
                unit: line.unit.trim(),
                quantity: new Prisma.Decimal(line.quantity),
                estimatedPrice: new Prisma.Decimal(line.estimatedPrice),
                totalEstimate: new Prisma.Decimal(lineTotal),
                budgetAvailableAtCheck: new Prisma.Decimal(budgetCheck.availableAmount),
                budgetVarianceAtCheck: new Prisma.Decimal(Math.max(0, budgetCheck.varianceAmount)),
                sortOrder: index,
              }
            }),
          },
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      })
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: `Modified purchase requisition ${requisition.prNo} before approval: ${modificationNote}`,
      oldValues,
      newValues: {
        totalEstimate,
        status: isFinalApproval ? 'APPROVED' : 'REVIEWED',
        modificationNote,
        approvalInstanceId: approvalResult.instanceId,
        approvalStep: approval.currentStep,
        lines: updated.lines.map((line) => ({
          id: line.id,
          description: line.description,
          specification: line.specification,
          unit: line.unit,
          quantity: line.quantity.toString(),
          estimatedPrice: line.estimatedPrice.toString(),
          totalEstimate: line.totalEstimate.toString(),
        })),
      },
      ...audit,
    })

    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'APPROVE',
      module: 'PROCUREMENT',
      resource: 'PurchaseRequisition',
      resourceId: id,
      description: isFinalApproval
        ? `Approved modified purchase requisition ${requisition.prNo}`
        : `Approved workflow step ${approval.currentStep} for modified purchase requisition ${requisition.prNo}`,
      newValues: {
        status: isFinalApproval ? 'APPROVED' : 'REVIEWED',
        approvalNote: approvalNote || null,
        approvalInstanceId: approvalResult.instanceId,
        approvalStep: approval.currentStep,
        budgetCheckStatus: budgetCheck.status,
        budgetWarningMessage: budgetCheck.message,
      },
      ...audit,
    })

    return apiSuccess({ ...updated, approval: approvalResult })
  } catch (error) {
    return handleRouteError(error)
  }
}
