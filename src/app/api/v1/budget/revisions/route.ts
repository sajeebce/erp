import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
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
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      budget: {
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
    }

    const budgetId = url.searchParams.get('budgetId')
    if (budgetId) {
      where.budgetId = budgetId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [revisions, total] = await Promise.all([
      prisma.budgetRevision.findMany({
        where,
        select: {
          id: true,
          revisionNo: true,
          budgetId: true,
          date: true,
          originalTotal: true,
          revisedTotal: true,
          changeAmount: true,
          changePercent: true,
          reason: true,
          status: true,
          approvedById: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          budget: {
            select: { id: true, name: true },
          },
          _count: {
            select: { lines: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.budgetRevision.count({ where }),
    ])

    return apiPaginated(revisions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const { budgetId, reason, lines } = body

    // Basic required fields
    if (!budgetId || !reason) {
      return apiBadRequest('budgetId and reason are required')
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one revision line is required')
    }

    // Validate budget exists and belongs to org
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        project: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      include: {
        lines: {
          select: { id: true, totalAmount: true },
        },
      },
    })

    if (!budget) {
      return apiBadRequest('Budget not found in this organization')
    }

    // Validate each revision line
    const budgetLineMap = new Map(budget.lines.map((l) => [l.id, l]))

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.budgetLineId || line.revisedAmount === undefined) {
        return apiBadRequest(`Line ${i + 1}: budgetLineId and revisedAmount are required`)
      }
      if (!budgetLineMap.has(line.budgetLineId)) {
        return apiBadRequest(`Line ${i + 1}: budgetLineId "${line.budgetLineId}" not found in this budget`)
      }
    }

    // Calculate totals
    const originalTotal = Number(budget.totalAmount)

    // Build a map of revised amounts (only for lines being revised)
    const revisedLineAmounts = new Map<string, number>()
    for (const line of lines) {
      revisedLineAmounts.set(line.budgetLineId, Number(line.revisedAmount))
    }

    // Calculate revisedTotal: sum of all budget lines with revisions applied
    let revisedTotal = 0
    for (const budgetLine of budget.lines) {
      if (revisedLineAmounts.has(budgetLine.id)) {
        revisedTotal += revisedLineAmounts.get(budgetLine.id)!
      } else {
        revisedTotal += Number(budgetLine.totalAmount)
      }
    }

    const changeAmount = revisedTotal - originalTotal
    const changePercent = originalTotal > 0
      ? Math.round((changeAmount / originalTotal) * 10000) / 100
      : 0

    // Generate revision number
    const revisionNo = await generateNextNumber(auth.organizationId, 'budget_revision')

    // Create revision with lines in a transaction
    const revision = await prisma.$transaction(async (tx) => {
      const created = await tx.budgetRevision.create({
        data: {
          revisionNo,
          budgetId,
          originalTotal: new Prisma.Decimal(originalTotal),
          revisedTotal: new Prisma.Decimal(revisedTotal),
          changeAmount: new Prisma.Decimal(changeAmount),
          changePercent: new Prisma.Decimal(changePercent),
          reason: reason.trim(),
          status: 'DRAFT',
          lines: {
            create: lines.map(
              (line: { budgetLineId: string; revisedAmount: number }) => {
                const budgetLine = budgetLineMap.get(line.budgetLineId)!
                const origAmount = Number(budgetLine.totalAmount)
                const revAmount = Number(line.revisedAmount)
                return {
                  budgetLineId: line.budgetLineId,
                  originalAmount: new Prisma.Decimal(origAmount),
                  revisedAmount: new Prisma.Decimal(revAmount),
                  changeAmount: new Prisma.Decimal(revAmount - origAmount),
                }
              }
            ),
          },
        },
        include: {
          lines: {
            include: {
              budgetLine: {
                include: {
                  account: {
                    select: { id: true, code: true, name: true },
                  },
                },
              },
            },
          },
          budget: {
            select: { id: true, name: true },
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
      resource: 'budget_revision',
      resourceId: revision.id,
      description: `Created budget revision ${revisionNo} for budget "${budget.name}"`,
      newValues: { revisionNo, budgetId, originalTotal, revisedTotal, changeAmount, changePercent },
      ...auditCtx,
    })

    return apiCreated(revision)
  } catch (error) {
    return handleRouteError(error)
  }
}
