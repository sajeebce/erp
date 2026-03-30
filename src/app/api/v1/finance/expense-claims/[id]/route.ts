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
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const claim = await prisma.expenseClaim.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!claim) {
      return apiNotFound('Expense claim not found')
    }

    // Enrich with related data
    const [employee, project, grant, advance] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: claim.employeeId },
        select: { id: true, fullName: true, employeeNo: true, email: true },
      }),
      claim.projectId
        ? prisma.project.findFirst({
            where: { id: claim.projectId },
            select: { id: true, name: true, projectNo: true },
          })
        : null,
      claim.grantId
        ? prisma.grant.findFirst({
            where: { id: claim.grantId },
            select: { id: true, title: true, grantNo: true },
          })
        : null,
      claim.advanceId
        ? prisma.employeeAdvance.findFirst({
            where: { id: claim.advanceId },
            select: {
              id: true,
              advanceNo: true,
              disbursedAmount: true,
              settledAmount: true,
              status: true,
            },
          })
        : null,
    ])

    return apiSuccess({
      ...claim,
      employee,
      project,
      grant,
      advance,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.expenseClaim.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Expense claim not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT claims can be updated')
    }

    const body = await request.json()
    const {
      purpose,
      items,
      projectId,
      grantId,
      travelStartDate,
      travelEndDate,
      advanceId,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}

    if (purpose !== undefined) updateData.purpose = purpose.trim()
    if (notes !== undefined) updateData.notes = notes || null
    if (travelStartDate !== undefined)
      updateData.travelStartDate = travelStartDate ? new Date(travelStartDate) : null
    if (travelEndDate !== undefined)
      updateData.travelEndDate = travelEndDate ? new Date(travelEndDate) : null

    // Validate projectId if provided
    if (projectId !== undefined) {
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, organizationId: auth.organizationId },
        })
        if (!project) {
          return apiBadRequest('Invalid project ID')
        }
      }
      updateData.projectId = projectId || null
    }

    // Validate grantId if provided
    if (grantId !== undefined) {
      if (grantId) {
        const grant = await prisma.grant.findFirst({
          where: { id: grantId, donor: { organizationId: auth.organizationId } },
        })
        if (!grant) {
          return apiBadRequest('Invalid grant ID')
        }
      }
      updateData.grantId = grantId || null
    }

    // Validate advanceId if provided
    if (advanceId !== undefined) {
      if (advanceId) {
        const employee = await prisma.employee.findFirst({
          where: { userId: auth.userId, organizationId: auth.organizationId },
        })
        const advance = await prisma.employeeAdvance.findFirst({
          where: {
            id: advanceId,
            organizationId: auth.organizationId,
            employeeId: employee?.id,
            status: { in: ['DISBURSED', 'PARTIALLY_SETTLED'] },
          },
        })
        if (!advance) {
          return apiBadRequest('Invalid advance ID or advance is not in a disbursed state')
        }
      }
      updateData.advanceId = advanceId || null
    }

    // If items provided, replace them entirely
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return apiBadRequest('At least one item is required')
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.date || !item.category || !item.description || !item.amount) {
          return apiBadRequest(
            `Item ${i + 1}: date, category, description, and amount are required`,
          )
        }
        const amt = Number(item.amount)
        if (isNaN(amt) || amt <= 0) {
          return apiBadRequest(`Item ${i + 1}: amount must be greater than 0`)
        }
      }

      const totalAmount = items.reduce(
        (sum: number, item: { amount: number | string }) => sum + Number(item.amount),
        0,
      )
      updateData.totalAmount = new Prisma.Decimal(totalAmount)

      const result = await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.expenseClaimItem.deleteMany({ where: { claimId: id } })

        // Update claim and create new items
        return tx.expenseClaim.update({
          where: { id },
          data: {
            ...updateData,
            items: {
              create: items.map(
                (
                  item: {
                    date: string
                    category: string
                    description: string
                    amount: number | string
                    accountId?: string
                    receiptPath?: string
                    hasReceipt?: boolean
                    noReceiptReason?: string
                    tdsRate?: number | string
                    vdsRate?: number | string
                    location?: string
                    notes?: string
                    projectId?: string
                    budgetLineId?: string
                  },
                  index: number,
                ) => {
                  const amt = Number(item.amount)
                  const tdsRate = item.tdsRate ? Number(item.tdsRate) : null
                  const vdsRate = item.vdsRate ? Number(item.vdsRate) : null
                  const tdsAmount = tdsRate ? (amt * tdsRate) / 100 : null
                  const vdsAmount = vdsRate ? (amt * vdsRate) / 100 : null

                  return {
                    date: new Date(item.date),
                    category: item.category,
                    description: item.description.trim(),
                    amount: new Prisma.Decimal(amt),
                    accountId: item.accountId || null,
                    receiptPath: item.receiptPath || null,
                    hasReceipt: item.hasReceipt ?? false,
                    noReceiptReason: item.noReceiptReason || null,
                    tdsRate: tdsRate !== null ? new Prisma.Decimal(tdsRate) : null,
                    tdsAmount: tdsAmount !== null ? new Prisma.Decimal(tdsAmount) : null,
                    vdsRate: vdsRate !== null ? new Prisma.Decimal(vdsRate) : null,
                    vdsAmount: vdsAmount !== null ? new Prisma.Decimal(vdsAmount) : null,
                    location: item.location || null,
                    notes: item.notes || null,
                    projectId: item.projectId || null,
                    budgetLineId: item.budgetLineId || null,
                    sortOrder: index,
                  }
                },
              ),
            },
          },
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        })
      })

      const auditCtx = getAuditContext(request)
      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: 'UPDATE',
        module: 'finance',
        resource: 'expense_claim',
        resourceId: id,
        description: `Updated expense claim ${existing.claimNo} with new items`,
        oldValues: { totalAmount: existing.totalAmount.toString() },
        newValues: updateData,
        ...auditCtx,
      })

      return apiSuccess(result)
    }

    // Update without items
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: updateData,
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: id,
      description: `Updated expense claim ${existing.claimNo}`,
      oldValues: { purpose: existing.purpose },
      newValues: updateData,
      ...auditCtx,
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

    const existing = await prisma.expenseClaim.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) {
      return apiNotFound('Expense claim not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT claims can be deleted')
    }

    await prisma.$transaction(async (tx) => {
      await tx.expenseClaimItem.deleteMany({ where: { claimId: id } })
      await tx.expenseClaim.delete({ where: { id } })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: id,
      description: `Deleted expense claim ${existing.claimNo}`,
      oldValues: {
        claimNo: existing.claimNo,
        purpose: existing.purpose,
        totalAmount: existing.totalAmount.toString(),
      },
      ...auditCtx,
    })

    return apiSuccess({ message: 'Expense claim deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
