import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

/**
 * Sector-wise Trial Balance.
 *
 * Same shape as the standard trial balance, but rows are grouped by sector
 * (derived from JournalEntryLine.businessUnit.sectorId) and each group has
 * its own subtotal alongside a grand total. A "Sector unassigned" bucket
 * collects lines whose businessUnitId is null or whose BU is not tied to a sector.
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
    const sectorIdFilter = url.searchParams.get('sectorId') || undefined
    const fundClassId = url.searchParams.get('fundClassId') || undefined
    const projectId = url.searchParams.get('projectId') || undefined
    const grantId = url.searchParams.get('grantId') || undefined

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return apiBadRequest('startDate must be on or before endDate')
    }

    const periodStart = startDate ? new Date(startDate) : fiscalYear.startDate
    const periodEnd = endDate ? new Date(endDate) : fiscalYear.endDate

    const lines = await prisma.journalEntryLine.findMany({
      where: {
        account: { organizationId: auth.organizationId, isGroup: false, deletedAt: null },
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
          fiscalYearId,
          fiscalYear: { organizationId: auth.organizationId },
          date: { gte: periodStart, lte: periodEnd },
          ...(projectId ? { projectId } : {}),
          ...(grantId ? { grantId } : {}),
        },
        ...(fundClassId ? { fundClassId } : {}),
        ...(sectorIdFilter ? { businessUnit: { sectorId: sectorIdFilter } } : {}),
      },
      select: {
        debit: true,
        credit: true,
        account: { select: { id: true, code: true, name: true, type: true, nature: true } },
        businessUnit: { select: { id: true, code: true, sectorId: true } },
      },
    })

    // Sectors lookup so we can label rows even if no lines reference them
    const sectors = await prisma.sector.findMany({
      where: {
        organizationId: auth.organizationId,
        isActive: true,
        ...(sectorIdFilter ? { id: sectorIdFilter } : {}),
      },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    })
    const sectorById = new Map(sectors.map((s) => [s.id, s]))

    type SectorBucket = {
      sectorId: string | null
      sectorCode: string
      sectorName: string
      accounts: Map<string, { code: string; name: string; type: string; debit: number; credit: number }>
    }
    const groups = new Map<string, SectorBucket>()

    for (const l of lines) {
      const sectorId = l.businessUnit?.sectorId ?? null
      const groupKey = sectorId ?? '_unassigned'
      const meta = sectorId ? sectorById.get(sectorId) : null

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          sectorId,
          sectorCode: meta?.code ?? '—',
          sectorName: meta?.name ?? 'Sector unassigned',
          accounts: new Map(),
        })
      }
      const bucket = groups.get(groupKey)!
      const accKey = l.account.id
      if (!bucket.accounts.has(accKey)) {
        bucket.accounts.set(accKey, {
          code: l.account.code,
          name: l.account.name,
          type: l.account.type,
          debit: 0,
          credit: 0,
        })
      }
      const acc = bucket.accounts.get(accKey)!
      acc.debit += Number(l.debit)
      acc.credit += Number(l.credit)
    }

    const sectorRows = [...groups.values()]
      .map((bucket) => {
        const accounts = [...bucket.accounts.values()]
          .filter((a) => a.debit !== 0 || a.credit !== 0)
          .map((a) => {
            const closingDebit = a.debit > a.credit ? a.debit - a.credit : 0
            const closingCredit = a.credit > a.debit ? a.credit - a.debit : 0
            return {
              accountCode: a.code,
              accountName: a.name,
              accountType: a.type,
              periodDebit: a.debit,
              periodCredit: a.credit,
              closingDebit,
              closingCredit,
            }
          })
          .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
        return {
          sectorId: bucket.sectorId,
          sectorCode: bucket.sectorCode,
          sectorName: bucket.sectorName,
          accounts,
          subtotal: {
            periodDebit: accounts.reduce((s, a) => s + a.periodDebit, 0),
            periodCredit: accounts.reduce((s, a) => s + a.periodCredit, 0),
            closingDebit: accounts.reduce((s, a) => s + a.closingDebit, 0),
            closingCredit: accounts.reduce((s, a) => s + a.closingCredit, 0),
          },
        }
      })
      .filter((row) => row.accounts.length > 0)
      .sort((a, b) => {
        if (a.sectorId === null && b.sectorId !== null) return 1
        if (b.sectorId === null && a.sectorId !== null) return -1
        return a.sectorCode.localeCompare(b.sectorCode)
      })

    const totals = {
      periodDebit: sectorRows.reduce((s, r) => s + r.subtotal.periodDebit, 0),
      periodCredit: sectorRows.reduce((s, r) => s + r.subtotal.periodCredit, 0),
      closingDebit: sectorRows.reduce((s, r) => s + r.subtotal.closingDebit, 0),
      closingCredit: sectorRows.reduce((s, r) => s + r.subtotal.closingCredit, 0),
    }

    return apiSuccess({
      reportType: 'sector-trial-balance',
      fiscalYearId,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      filters: {
        sectorId: sectorIdFilter ?? null,
        fundClassId: fundClassId ?? null,
        projectId: projectId ?? null,
        grantId: grantId ?? null,
      },
      sectors: sectorRows,
      totals: {
        ...totals,
        isBalanced: Math.abs(totals.periodDebit - totals.periodCredit) < 0.01,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
