import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

/**
 * Inter-Concern Transactions report.
 *
 * Lists APPROVED journal entries whose lines span >1 distinct businessUnitId
 * or >1 distinct fundClassId — i.e., postings that move value between concerns.
 * Supports optional date range, businessUnitId filter (returns JEs that touch
 * the given BU AND at least one other BU), and fundClassId filter.
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
    const businessUnitId = url.searchParams.get('businessUnitId') || undefined
    const fundClassId = url.searchParams.get('fundClassId') || undefined

    // Date sanity: if both set and startDate > endDate, return BAD_REQUEST.
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return apiBadRequest('startDate must be on or before endDate')
    }

    const periodStart = startDate ? new Date(startDate) : fiscalYear.startDate
    const periodEnd = endDate ? new Date(endDate) : fiscalYear.endDate

    // Pull every approved JE in the org/fiscal year + period — keep payload bounded with
    // limit (the user is expected to drill in via business-unit filter for big orgs).
    const entries = await prisma.journalEntry.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        fiscalYearId,
        date: { gte: periodStart, lte: periodEnd },
        // tenant scoping via fiscalYear's organizationId
        fiscalYear: { organizationId: auth.organizationId },
      },
      select: {
        id: true,
        entryNo: true,
        date: true,
        description: true,
        reference: true,
        sourceModule: true,
        totalDebit: true,
        totalCredit: true,
        lines: {
          select: {
            debit: true,
            credit: true,
            businessUnitId: true,
            fundClassId: true,
            account: { select: { code: true, name: true } },
            businessUnit: { select: { id: true, code: true, name: true, shortName: true } },
            fundClass: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 500,
    })

    const inter = entries
      .map((entry) => {
        const buIds = new Set(entry.lines.map((l) => l.businessUnitId).filter((v): v is string => Boolean(v)))
        const fcIds = new Set(entry.lines.map((l) => l.fundClassId).filter((v): v is string => Boolean(v)))
        const spansMultipleBu = buIds.size > 1
        const spansMultipleFc = fcIds.size > 1
        const matchesBuFilter = !businessUnitId || buIds.has(businessUnitId)
        const matchesFcFilter = !fundClassId || fcIds.has(fundClassId)

        if (!(spansMultipleBu || spansMultipleFc)) return null
        if (!matchesBuFilter || !matchesFcFilter) return null

        const lineSummary = entry.lines.map((l) => ({
          accountCode: l.account.code,
          accountName: l.account.name,
          debit: Number(l.debit),
          credit: Number(l.credit),
          businessUnitCode: l.businessUnit?.code ?? null,
          businessUnitName: l.businessUnit?.shortName ?? l.businessUnit?.name ?? null,
          fundClassCode: l.fundClass?.code ?? null,
          fundClassName: l.fundClass?.name ?? null,
        }))

        return {
          journalEntryId: entry.id,
          entryNo: entry.entryNo,
          date: entry.date,
          description: entry.description,
          reference: entry.reference,
          sourceModule: entry.sourceModule,
          totalDebit: Number(entry.totalDebit),
          totalCredit: Number(entry.totalCredit),
          businessUnitCount: buIds.size,
          fundClassCount: fcIds.size,
          spansMultipleBu,
          spansMultipleFc,
          lines: lineSummary,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    return apiSuccess({
      reportType: 'inter-concern-transactions',
      fiscalYearId,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      filters: { businessUnitId: businessUnitId ?? null, fundClassId: fundClassId ?? null },
      entries: inter,
      summary: {
        totalEntries: inter.length,
        totalDebit: inter.reduce((s, e) => s + e.totalDebit, 0),
        totalCredit: inter.reduce((s, e) => s + e.totalCredit, 0),
        crossBuCount: inter.filter((e) => e.spansMultipleBu).length,
        crossFcCount: inter.filter((e) => e.spansMultipleFc).length,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
