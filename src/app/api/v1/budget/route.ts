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
import { generateNextNumber } from '@/lib/number-sequence'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      project: { organizationId: auth.organizationId },
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { budgetCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const grantId = url.searchParams.get('grantId')
    if (grantId) {
      where.grantId = grantId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const budgetType = url.searchParams.get('budgetType')
    if (budgetType) {
      where.budgetType = budgetType
    }

    const fiscalYearId = url.searchParams.get('fiscalYearId')
    if (fiscalYearId) {
      where.fiscalYearId = fiscalYearId
    }

    const departmentId = url.searchParams.get('departmentId')
    if (departmentId) {
      where.departmentId = departmentId
    }

    const costCenterId = url.searchParams.get('costCenterId')
    if (costCenterId) {
      where.costCenterId = costCenterId
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        select: {
          id: true,
          budgetCode: true,
          name: true,
          budgetType: true,
          projectId: true,
          departmentId: true,
          costCenterId: true,
          grantId: true,
          fiscalYearId: true,
          startDate: true,
          endDate: true,
          periodType: true,
          totalAmount: true,
          currencyCode: true,
          status: true,
          version: true,
          indirectCostRate: true,
          indirectCostAmount: true,
          costShareRequired: true,
          costShareAmount: true,
          donorAmount: true,
          budgetCeiling: true,
          varianceThreshold: true,
          approvedById: true,
          approvedAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: { id: true, name: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          costCenter: {
            select: { id: true, name: true, code: true },
          },
          grant: {
            select: { id: true, title: true },
          },
          _count: {
            select: { lines: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.budget.count({ where }),
    ])

    // Calculate utilization % for each budget
    const budgetsWithUtilization = await Promise.all(
      budgets.map(async (budget) => {
        const actualSpend = await prisma.journalEntryLine.aggregate({
          where: {
            accountId: {
              in: await prisma.budgetLine
                .findMany({
                  where: { budgetId: budget.id },
                  select: { accountId: true },
                })
                .then((lines) => lines.map((l) => l.accountId)),
            },
            journalEntry: {
              status: 'APPROVED',
              projectId: budget.projectId,
              deletedAt: null,
            },
          },
          _sum: { debit: true },
        })

        const totalBudget = Number(budget.totalAmount)
        const totalActual = Number(actualSpend._sum.debit ?? 0)
        const utilizationPercent = totalBudget > 0
          ? Math.round((totalActual / totalBudget) * 10000) / 100
          : 0

        return {
          ...budget,
          utilizationPercent,
        }
      })
    )

    return apiPaginated(budgetsWithUtilization, total, page, limit)
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
      budgetType,
      projectId,
      departmentId,
      costCenterId,
      grantId,
      fiscalYearId,
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

    // Basic required fields
    if (!name || !projectId || !fiscalYearId || totalAmount === undefined) {
      return apiBadRequest('name, projectId, fiscalYearId, and totalAmount are required')
    }

    // Validate lines
    if (!Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one budget line is required')
    }

    // Validate each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.accountId || !line.category || !line.description) {
        return apiBadRequest(`Line ${i + 1}: accountId, category, and description are required`)
      }
      if (line.totalAmount === undefined || Number(line.totalAmount) <= 0) {
        return apiBadRequest(`Line ${i + 1}: totalAmount must be greater than 0`)
      }
    }

    // Calculate ICR amount if rate is provided
    let calculatedICR: number | null = null
    if (indirectCostRate && indirectCostRate > 0) {
      const lineTotal = lines.reduce(
        (sum: number, l: { totalAmount: number; category?: string }) => sum + Number(l.totalAmount),
        0
      )

      if (indirectCostBase === 'PERSONNEL') {
        const personnelTotal = lines
          .filter((l: { category?: string }) => l.category === 'Personnel')
          .reduce((sum: number, l: { totalAmount: number }) => sum + Number(l.totalAmount), 0)
        calculatedICR = Math.round(personnelTotal * (indirectCostRate / 100) * 100) / 100
      } else {
        // TOTAL_DIRECT or MTDC
        calculatedICR = Math.round(lineTotal * (indirectCostRate / 100) * 100) / 100
      }
    }

    // Validate sum of line totalAmounts equals budget totalAmount (excluding ICR)
    const lineTotal = lines.reduce(
      (sum: number, l: { totalAmount: number }) => sum + Number(l.totalAmount),
      0
    )
    const expectedTotal = calculatedICR
      ? lineTotal + calculatedICR
      : lineTotal

    if (Math.abs(expectedTotal - Number(totalAmount)) > 0.01) {
      return apiBadRequest(
        `Sum of line amounts${calculatedICR ? ' + ICR' : ''} (${expectedTotal}) must equal budget totalAmount (${totalAmount})`
      )
    }

    // Calculate cost share amounts
    let costShareAmt: number | null = null
    let donorAmt: number | null = null
    if (costShareRequired && costSharePercent && costSharePercent > 0) {
      costShareAmt = Math.round(Number(totalAmount) * (costSharePercent / 100) * 100) / 100
      donorAmt = Math.round((Number(totalAmount) - costShareAmt) * 100) / 100
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
      },
    })
    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Validate grant belongs to org (if provided)
    if (grantId) {
      const grant = await prisma.grant.findFirst({
        where: { id: grantId, donor: { organizationId: auth.organizationId } },
      })
      if (!grant) {
        return apiBadRequest('Grant not found in this organization')
      }
    }

    // Validate fiscal year belongs to org
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: fiscalYearId,
        organizationId: auth.organizationId,
      },
    })
    if (!fiscalYear) {
      return apiBadRequest('Fiscal year not found in this organization')
    }

    // Validate budget ceiling
    if (budgetCeiling && Number(totalAmount) > Number(budgetCeiling)) {
      return apiBadRequest(`Total amount (${totalAmount}) exceeds budget ceiling (${budgetCeiling})`)
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

    // Generate budget code
    let budgetCode: string
    try {
      budgetCode = await generateNextNumber(auth.organizationId, 'budget')
    } catch {
      // If sequence doesn't exist yet, create it and try again
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

    // Create budget with lines in a transaction
    const budget = await prisma.$transaction(async (tx) => {
      const created = await tx.budget.create({
        data: {
          budgetCode,
          name: name.trim(),
          budgetType: budgetType || 'PROJECT',
          projectId,
          departmentId: departmentId || null,
          costCenterId: costCenterId || null,
          grantId: grantId || null,
          fiscalYearId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          periodType: periodType || 'ANNUAL',
          totalAmount: new Prisma.Decimal(totalAmount),
          currencyCode: currencyCode || 'BDT',
          exchangeRate: exchangeRate ? new Prisma.Decimal(exchangeRate) : null,
          status: 'DRAFT',
          version: 1,
          indirectCostRate: indirectCostRate ? new Prisma.Decimal(indirectCostRate) : null,
          indirectCostBase: indirectCostBase || null,
          indirectCostAmount: calculatedICR ? new Prisma.Decimal(calculatedICR) : null,
          costShareRequired: costShareRequired || false,
          costSharePercent: costSharePercent ? new Prisma.Decimal(costSharePercent) : null,
          costShareAmount: costShareAmt ? new Prisma.Decimal(costShareAmt) : null,
          donorAmount: donorAmt ? new Prisma.Decimal(donorAmt) : null,
          budgetCeiling: budgetCeiling ? new Prisma.Decimal(budgetCeiling) : null,
          varianceThreshold: varianceThreshold != null ? new Prisma.Decimal(varianceThreshold) : new Prisma.Decimal(10),
          narrative: narrative || null,
          assumptions: assumptions || null,
          notes: notes || null,
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
          department: {
            select: { id: true, name: true, code: true },
          },
          costCenter: {
            select: { id: true, name: true, code: true },
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
      resourceId: budget.id,
      description: `Created budget "${name}" (${budgetCode})`,
      newValues: { name, budgetCode, budgetType, totalAmount, projectId, lineCount: lines.length },
      ...auditCtx,
    })

    return apiCreated(budget)
  } catch (error) {
    return handleRouteError(error)
  }
}
