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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { project: { organizationId: auth.organizationId } },
          { businessUnit: { organizationId: auth.organizationId } },
        ],
      },
      include: {
        project: {
          select: { id: true, name: true, projectNo: true },
        },
        businessUnit: {
          select: { id: true, code: true, name: true, shortName: true },
        },
        costCenter: {
          select: { id: true, code: true, name: true },
        },
        fundClass: {
          select: { id: true, code: true, name: true },
        },
        grant: {
          select: { id: true, title: true, grantNo: true },
        },
        fiscalYear: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { revisions: true },
        },
      },
    })

    if (!budget) {
      return apiNotFound('Budget not found')
    }

    return apiSuccess(budget)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { project: { organizationId: auth.organizationId } },
          { businessUnit: { organizationId: auth.organizationId } },
        ],
      },
    })

    if (!existing) {
      return apiNotFound('Budget not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT budgets can be updated')
    }

    const body = await request.json()
    const {
      name,
      budgetType,
      startDate,
      endDate,
      periodType,
      totalAmount,
      currencyCode,
      exchangeRate,
      indirectCostRate,
      indirectCostBase,
      costShareRequired,
      costSharePercent,
      budgetCeiling,
      varianceThreshold,
      narrative,
      assumptions,
      notes,
      lines,
    } = body

    // Build update data
    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = name.trim()
    }

    if (budgetType !== undefined) data.budgetType = budgetType
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (periodType !== undefined) data.periodType = periodType
    if (currencyCode !== undefined) data.currencyCode = currencyCode
    if (exchangeRate !== undefined) data.exchangeRate = exchangeRate ? new Prisma.Decimal(exchangeRate) : null
    if (notes !== undefined) data.notes = notes || null
    if (narrative !== undefined) data.narrative = narrative || null
    if (assumptions !== undefined) data.assumptions = assumptions || null
    if (budgetCeiling !== undefined) data.budgetCeiling = budgetCeiling ? new Prisma.Decimal(budgetCeiling) : null
    if (varianceThreshold !== undefined) data.varianceThreshold = new Prisma.Decimal(varianceThreshold)

    if (totalAmount !== undefined) {
      data.totalAmount = new Prisma.Decimal(totalAmount)
    }

    // Handle ICR
    if (indirectCostRate !== undefined) {
      data.indirectCostRate = indirectCostRate ? new Prisma.Decimal(indirectCostRate) : null
      data.indirectCostBase = indirectCostBase || null

      if (indirectCostRate && indirectCostRate > 0 && lines) {
        const lineTotal = lines.reduce(
          (sum: number, l: { totalAmount: number; category?: string }) => sum + Number(l.totalAmount),
          0
        )
        if (indirectCostBase === 'PERSONNEL') {
          const personnelTotal = lines
            .filter((l: { category?: string }) => l.category === 'Personnel')
            .reduce((sum: number, l: { totalAmount: number }) => sum + Number(l.totalAmount), 0)
          data.indirectCostAmount = new Prisma.Decimal(Math.round(personnelTotal * (indirectCostRate / 100) * 100) / 100)
        } else {
          data.indirectCostAmount = new Prisma.Decimal(Math.round(lineTotal * (indirectCostRate / 100) * 100) / 100)
        }
      } else {
        data.indirectCostAmount = null
      }
    }

    // Handle cost sharing
    if (costShareRequired !== undefined) {
      data.costShareRequired = costShareRequired
      if (costShareRequired && costSharePercent) {
        data.costSharePercent = new Prisma.Decimal(costSharePercent)
        const effectiveTotal = totalAmount !== undefined ? Number(totalAmount) : Number(existing.totalAmount)
        const shareAmt = Math.round(effectiveTotal * (costSharePercent / 100) * 100) / 100
        data.costShareAmount = new Prisma.Decimal(shareAmt)
        data.donorAmount = new Prisma.Decimal(Math.round((effectiveTotal - shareAmt) * 100) / 100)
      } else {
        data.costSharePercent = null
        data.costShareAmount = null
        data.donorAmount = null
      }
    }

    // If lines are provided, validate and replace entirely
    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length === 0) {
        return apiBadRequest('At least one budget line is required')
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line.accountId || !line.category || !line.description) {
          return apiBadRequest(`Line ${i + 1}: accountId, category, and description are required`)
        }
        if (line.totalAmount === undefined || Number(line.totalAmount) <= 0) {
          return apiBadRequest(`Line ${i + 1}: totalAmount must be greater than 0`)
        }
      }

      // Validate all accountIds exist in same org
      const accountIds = lines.map((l: { accountId: string }) => l.accountId)
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          organizationId: auth.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (accounts.length !== new Set(accountIds).size) {
        return apiBadRequest('One or more account IDs are invalid or not found in this organization')
      }
    }

    // Update in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // If lines provided, delete old lines and create new ones
      if (lines !== undefined) {
        await tx.budgetLine.deleteMany({ where: { budgetId: id } })
      }

      const budget = await tx.budget.update({
        where: { id },
        data: {
          ...data,
          ...(lines !== undefined && {
            lines: {
              create: lines.map(
                (
                  line: {
                    accountId: string
                    category: string
                    subCategory?: string
                    description: string
                    unit?: string
                    quantity?: number
                    unitCost: number
                    totalAmount: number
                    levelOfEffort?: number
                    duration?: number
                    donorShare?: number
                    costShare?: number
                    narrative?: string
                    notes?: string
                  },
                  index: number
                ) => ({
                  accountId: line.accountId,
                  category: line.category,
                  subCategory: line.subCategory || null,
                  description: line.description,
                  unit: line.unit || null,
                  quantity: new Prisma.Decimal(line.quantity ?? 1),
                  unitCost: new Prisma.Decimal(line.unitCost),
                  totalAmount: new Prisma.Decimal(line.totalAmount),
                  levelOfEffort: line.levelOfEffort != null ? new Prisma.Decimal(line.levelOfEffort) : null,
                  duration: line.duration || null,
                  donorShare: line.donorShare != null ? new Prisma.Decimal(line.donorShare) : null,
                  costShare: line.costShare != null ? new Prisma.Decimal(line.costShare) : null,
                  narrative: line.narrative || null,
                  notes: line.notes || null,
                  sortOrder: index,
                })
              ),
            },
          }),
        },
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, code: true, name: true },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          project: {
            select: { id: true, name: true },
          },
          grant: {
            select: { id: true, title: true },
          },
        },
      })

      return budget
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'budget',
      resource: 'budget',
      resourceId: id,
      description: `Updated budget "${updated.name}"`,
      oldValues: { name: existing.name, totalAmount: Number(existing.totalAmount) },
      newValues: { name: updated.name, totalAmount: Number(updated.totalAmount) },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.budget.findFirst({
      where: {
        id,
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Budget not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT budgets can be deleted')
    }

    // Soft delete
    await prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'budget',
      resource: 'budget',
      resourceId: id,
      description: `Deleted budget "${existing.name}"`,
      oldValues: { name: existing.name, totalAmount: Number(existing.totalAmount) },
      ...auditCtx,
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
