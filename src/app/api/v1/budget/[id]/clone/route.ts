import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'
import { generateNextNumber } from '@/lib/number-sequence'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const body = await request.json().catch(() => ({}))
    const escalationPercent = body.escalationPercent ? Number(body.escalationPercent) : 0

    if (escalationPercent < -100 || escalationPercent > 1000) {
      return apiBadRequest('Escalation percent must be between -100 and 1000')
    }

    // Fetch the source budget with lines
    const source = await prisma.budget.findFirst({
      where: {
        id,
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!source) {
      return apiNotFound('Budget not found')
    }

    // Generate new budget code
    let budgetCode: string
    try {
      budgetCode = await generateNextNumber(auth.organizationId, 'budget')
    } catch {
      await prisma.numberSequence.create({
        data: {
          organizationId: auth.organizationId,
          entity: 'budget',
          prefix: 'BUD',
          separator: '-',
          padLength: 4,
          currentValue: 0,
          includeYear: true,
        },
      })
      budgetCode = await generateNextNumber(auth.organizationId, 'budget')
    }

    const escalationMultiplier = 1 + escalationPercent / 100

    // Calculate escalated line totals
    const escalatedLines = source.lines.map((line, index) => {
      const newUnitCost = Math.round(Number(line.unitCost) * escalationMultiplier * 100) / 100
      const newTotal = Math.round(Number(line.quantity) * newUnitCost * 100) / 100

      return {
        accountId: line.accountId,
        category: line.category,
        subCategory: line.subCategory,
        description: line.description,
        unit: line.unit,
        quantity: line.quantity,
        unitCost: new Prisma.Decimal(newUnitCost),
        totalAmount: new Prisma.Decimal(newTotal),
        levelOfEffort: line.levelOfEffort,
        duration: line.duration,
        donorShare: line.donorShare
          ? new Prisma.Decimal(Math.round(Number(line.donorShare) * escalationMultiplier * 100) / 100)
          : null,
        costShare: line.costShare
          ? new Prisma.Decimal(Math.round(Number(line.costShare) * escalationMultiplier * 100) / 100)
          : null,
        narrative: line.narrative,
        notes: line.notes,
        sortOrder: index,
      }
    })

    const newLineTotal = escalatedLines.reduce(
      (sum, l) => sum + Number(l.totalAmount),
      0
    )

    // Calculate new ICR if applicable
    let newIcrAmount: number | null = null
    if (source.indirectCostRate && Number(source.indirectCostRate) > 0) {
      const rate = Number(source.indirectCostRate)
      if (source.indirectCostBase === 'PERSONNEL') {
        const personnelTotal = escalatedLines
          .filter((l) => l.category === 'Personnel' || l.category === 'Personnel & Fringe')
          .reduce((sum, l) => sum + Number(l.totalAmount), 0)
        newIcrAmount = Math.round(personnelTotal * (rate / 100) * 100) / 100
      } else {
        newIcrAmount = Math.round(newLineTotal * (rate / 100) * 100) / 100
      }
    }

    const newTotalAmount = Math.round((newLineTotal + (newIcrAmount ?? 0)) * 100) / 100

    // Calculate cost share amounts if applicable
    let costShareAmt: number | null = null
    let donorAmt: number | null = null
    if (source.costShareRequired && source.costSharePercent && Number(source.costSharePercent) > 0) {
      costShareAmt = Math.round(newTotalAmount * (Number(source.costSharePercent) / 100) * 100) / 100
      donorAmt = Math.round((newTotalAmount - costShareAmt) * 100) / 100
    }

    // Create the cloned budget
    const cloned = await prisma.$transaction(async (tx) => {
      const created = await tx.budget.create({
        data: {
          budgetCode,
          name: `${source.name} (Clone)`,
          budgetType: source.budgetType,
          projectId: source.projectId,
          grantId: source.grantId,
          fiscalYearId: source.fiscalYearId,
          startDate: source.startDate,
          endDate: source.endDate,
          periodType: source.periodType,
          totalAmount: new Prisma.Decimal(newTotalAmount),
          currencyCode: source.currencyCode,
          exchangeRate: source.exchangeRate,
          status: 'DRAFT',
          version: 1,
          indirectCostRate: source.indirectCostRate,
          indirectCostBase: source.indirectCostBase,
          indirectCostAmount: newIcrAmount ? new Prisma.Decimal(newIcrAmount) : null,
          costShareRequired: source.costShareRequired,
          costSharePercent: source.costSharePercent,
          costShareAmount: costShareAmt ? new Prisma.Decimal(costShareAmt) : null,
          donorAmount: donorAmt ? new Prisma.Decimal(donorAmt) : null,
          budgetCeiling: source.budgetCeiling,
          varianceThreshold: source.varianceThreshold,
          narrative: source.narrative,
          assumptions: source.assumptions,
          notes: escalationPercent
            ? `Cloned from ${source.budgetCode} with ${escalationPercent}% escalation`
            : `Cloned from ${source.budgetCode}`,
          lines: {
            create: escalatedLines,
          },
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

      return created
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'budget',
      resource: 'budget',
      resourceId: cloned.id,
      description: `Cloned budget from "${source.name}" (${source.budgetCode}) → "${cloned.name}" (${budgetCode})${escalationPercent ? ` with ${escalationPercent}% escalation` : ''}`,
      newValues: {
        sourceId: source.id,
        sourceBudgetCode: source.budgetCode,
        newBudgetCode: budgetCode,
        escalationPercent,
        totalAmount: newTotalAmount,
        lineCount: escalatedLines.length,
      },
      ...auditCtx,
    })

    return apiCreated(cloned)
  } catch (error) {
    return handleRouteError(error)
  }
}
