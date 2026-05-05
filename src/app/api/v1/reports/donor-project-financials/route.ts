import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

/**
 * Donor-wise Project Financials.
 *
 * One row per (donor, project) showing budget total, actual expense, and variance.
 * Project budget is summed from approved/active Budget rows tied to that project.
 * Actual is the sum of EXPENSE journal lines tagged to that project (line-level
 * dimensions honoured: BU, CC, FC).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)

    const fiscalYearId = url.searchParams.get('fiscalYearId')
    if (!fiscalYearId) return apiBadRequest('fiscalYearId is required')

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { id: fiscalYearId, organizationId: auth.organizationId },
    })
    if (!fiscalYear) return apiNotFound('Fiscal year not found in this organization')

    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const projectId = url.searchParams.get('projectId') || undefined
    const grantId = url.searchParams.get('grantId') || undefined
    const businessUnitId = url.searchParams.get('businessUnitId') || undefined
    const fundClassId = url.searchParams.get('fundClassId') || undefined

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return apiBadRequest('startDate must be on or before endDate')
    }

    const periodStart = startDate ? new Date(startDate) : fiscalYear.startDate
    const periodEnd = endDate ? new Date(endDate) : fiscalYear.endDate

    // Get projects scoped to org. Donor is referenced by FK column donorId only
    // (no direct relation), so we resolve donor names via a follow-up findMany.
    const projects = await prisma.project.findMany({
      where: {
        organizationId: auth.organizationId,
        ...(projectId ? { id: projectId } : {}),
      },
      select: {
        id: true,
        projectNo: true,
        name: true,
        totalBudget: true,
        amountSpent: true,
        donorId: true,
      },
      orderBy: { projectNo: 'asc' },
    })

    // Pull approved/active budget totals per project in one batched aggregate call.
    const projectIdList = projects.map((p) => p.id)
    const budgetRows = projectIdList.length
      ? await prisma.budget.groupBy({
          by: ['projectId'],
          where: {
            projectId: { in: projectIdList },
            status: { in: ['APPROVED', 'ACTIVE'] },
          },
          _sum: { totalAmount: true },
        })
      : []
    const budgetByProject = new Map<string, number>(
      budgetRows
        .filter((row): row is typeof row & { projectId: string } => row.projectId !== null)
        .map((row) => [row.projectId, Number(row._sum.totalAmount ?? 0)]),
    )

    const donorIds = [...new Set(projects.map((p) => p.donorId).filter((v): v is string => Boolean(v)))]
    const donors = donorIds.length
      ? await prisma.donor.findMany({
          where: { id: { in: donorIds }, organizationId: auth.organizationId },
          select: { id: true, name: true },
        })
      : []
    const donorById = new Map(donors.map((d) => [d.id, d]))

    // Aggregate expense by project from journal entry lines (line-level dim filters)
    const expenseAgg = await prisma.journalEntryLine.groupBy({
      by: ['projectId'],
      where: {
        account: {
          organizationId: auth.organizationId,
          type: 'EXPENSE',
          deletedAt: null,
        },
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
          fiscalYearId,
          fiscalYear: { organizationId: auth.organizationId },
          date: { gte: periodStart, lte: periodEnd },
          ...(grantId ? { grantId } : {}),
        },
        projectId: { not: null },
        ...(businessUnitId ? { businessUnitId } : {}),
        ...(fundClassId ? { fundClassId } : {}),
      },
      _sum: { debit: true, credit: true },
    })

    const expenseByProject = new Map<string, number>()
    for (const row of expenseAgg) {
      if (!row.projectId) continue
      const debit = Number(row._sum.debit ?? 0)
      const credit = Number(row._sum.credit ?? 0)
      expenseByProject.set(row.projectId, debit - credit)
    }

    const rows = projects.map((p) => {
      const totalBudget = budgetByProject.get(p.id) ?? 0
      const fallbackBudget = totalBudget === 0 ? Number(p.totalBudget) : totalBudget
      const actual = expenseByProject.get(p.id) ?? 0
      const variance = fallbackBudget - actual
      return {
        projectId: p.id,
        projectNo: p.projectNo,
        projectName: p.name,
        donorId: p.donorId,
        donorName: p.donorId ? donorById.get(p.donorId)?.name ?? '—' : '—',
        budget: fallbackBudget,
        actual,
        variance,
        utilizationRate: fallbackBudget > 0 ? Math.round((actual / fallbackBudget) * 1000) / 10 : 0,
      }
    })

    // If we filtered by grantId or have only-active selection, drop zero-everywhere rows
    const filtered = rows.filter((r) => r.budget !== 0 || r.actual !== 0)

    filtered.sort((a, b) => {
      if (a.donorName === b.donorName) return a.projectNo.localeCompare(b.projectNo)
      return a.donorName.localeCompare(b.donorName)
    })

    const summary = {
      totalProjects: filtered.length,
      totalBudget: filtered.reduce((s, r) => s + r.budget, 0),
      totalActual: filtered.reduce((s, r) => s + r.actual, 0),
      totalVariance: filtered.reduce((s, r) => s + r.variance, 0),
    }

    return apiSuccess({
      reportType: 'donor-project-financials',
      fiscalYearId,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      filters: {
        projectId: projectId ?? null,
        grantId: grantId ?? null,
        businessUnitId: businessUnitId ?? null,
        fundClassId: fundClassId ?? null,
      },
      rows: filtered,
      summary,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
