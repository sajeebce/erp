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

    const fiscalYearId = url.searchParams.get('fiscalYearId')
    if (fiscalYearId) {
      where.fiscalYearId = fiscalYearId
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        select: {
          id: true,
          name: true,
          projectId: true,
          grantId: true,
          fiscalYearId: true,
          totalAmount: true,
          currencyCode: true,
          status: true,
          approvedById: true,
          approvedAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: { id: true, name: true },
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
      projectId,
      grantId,
      fiscalYearId,
      totalAmount,
      currencyCode,
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

    // Validate sum of line totalAmounts equals budget totalAmount
    const lineTotal = lines.reduce(
      (sum: number, l: { totalAmount: number }) => sum + Number(l.totalAmount),
      0
    )
    if (Math.abs(lineTotal - Number(totalAmount)) > 0.01) {
      return apiBadRequest(
        `Sum of line amounts (${lineTotal}) must equal budget totalAmount (${totalAmount})`
      )
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

    // Create budget with lines in a transaction
    const budget = await prisma.$transaction(async (tx) => {
      const created = await tx.budget.create({
        data: {
          name: name.trim(),
          projectId,
          grantId: grantId || null,
          fiscalYearId,
          totalAmount: new Prisma.Decimal(totalAmount),
          currencyCode: currencyCode || 'BDT',
          status: 'DRAFT',
          notes: notes || null,
          lines: {
            create: lines.map(
              (
                line: {
                  accountId: string
                  category: string
                  description: string
                  unit?: string
                  quantity?: number
                  unitCost: number
                  totalAmount: number
                  notes?: string
                },
                index: number
              ) => ({
                accountId: line.accountId,
                category: line.category,
                description: line.description,
                unit: line.unit || null,
                quantity: new Prisma.Decimal(line.quantity ?? 1),
                unitCost: new Prisma.Decimal(line.unitCost),
                totalAmount: new Prisma.Decimal(line.totalAmount),
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
      description: `Created budget "${name}"`,
      newValues: { name, totalAmount, projectId, lineCount: lines.length },
      ...auditCtx,
    })

    return apiCreated(budget)
  } catch (error) {
    return handleRouteError(error)
  }
}
