import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, apiNotFound, handleRouteError } from '@/lib/api-response'

/**
 * Cost Center Expense Report.
 *
 * Sums APPROVED expense JE lines grouped by cost center for the given fiscal year
 * and optional period / dimension filters. Returns a row per cost center plus a
 * grand total. Lines without a costCenterId roll up under "Unassigned".
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
    const projectId = url.searchParams.get('projectId') || undefined
    const grantId = url.searchParams.get('grantId') || undefined
    const sectorId = url.searchParams.get('sectorId') || undefined

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return apiBadRequest('startDate must be on or before endDate')
    }

    const periodStart = startDate ? new Date(startDate) : fiscalYear.startDate
    const periodEnd = endDate ? new Date(endDate) : fiscalYear.endDate

    // Pull EXPENSE-account lines under the org's fiscal year, with all the dimension filters.
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        // tenant: account belongs to this org
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
          ...(projectId ? { projectId } : {}),
          ...(grantId ? { grantId } : {}),
        },
        ...(businessUnitId ? { businessUnitId } : {}),
        ...(fundClassId ? { fundClassId } : {}),
        ...(sectorId ? { businessUnit: { sectorId } } : {}),
      },
      select: {
        debit: true,
        credit: true,
        costCenterId: true,
        costCenter: { select: { id: true, code: true, name: true } },
        account: { select: { id: true, code: true, name: true } },
        businessUnit: { select: { id: true, code: true, name: true, shortName: true } },
      },
    })

    // Group: outer by cost center, inner by account
    const ccMap = new Map<
      string,
      {
        ccId: string | null
        ccCode: string
        ccName: string
        businessUnitCode: string | null
        accounts: Map<string, { code: string; name: string; amount: number }>
      }
    >()

    for (const l of lines) {
      const amount = Number(l.debit) - Number(l.credit) // expense net = DR - CR
      if (amount === 0) continue
      const ccKey = l.costCenter?.id ?? '_unassigned'
      const ccCode = l.costCenter?.code ?? '—'
      const ccName = l.costCenter?.name ?? 'Unassigned'
      const buCode = l.businessUnit?.code ?? null

      if (!ccMap.has(ccKey)) {
        ccMap.set(ccKey, {
          ccId: l.costCenter?.id ?? null,
          ccCode,
          ccName,
          businessUnitCode: buCode,
          accounts: new Map(),
        })
      }
      const bucket = ccMap.get(ccKey)!
      const accKey = l.account.id
      if (!bucket.accounts.has(accKey)) {
        bucket.accounts.set(accKey, { code: l.account.code, name: l.account.name, amount: 0 })
      }
      bucket.accounts.get(accKey)!.amount += amount
    }

    const costCenters = [...ccMap.values()]
      .map((bucket) => {
        const accounts = [...bucket.accounts.values()]
          .filter((a) => a.amount !== 0)
          .sort((a, b) => a.code.localeCompare(b.code))
        const subtotal = accounts.reduce((s, a) => s + a.amount, 0)
        return {
          costCenterId: bucket.ccId,
          costCenterCode: bucket.ccCode,
          costCenterName: bucket.ccName,
          businessUnitCode: bucket.businessUnitCode,
          accounts,
          subtotal,
        }
      })
      .filter((cc) => cc.subtotal !== 0)
      .sort((a, b) => {
        // Unassigned last
        if (a.costCenterId === null && b.costCenterId !== null) return 1
        if (b.costCenterId === null && a.costCenterId !== null) return -1
        return a.costCenterCode.localeCompare(b.costCenterCode)
      })

    const grandTotal = costCenters.reduce((s, cc) => s + cc.subtotal, 0)

    return apiSuccess({
      reportType: 'cost-center-expenses',
      fiscalYearId,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      filters: {
        sectorId: sectorId ?? null,
        businessUnitId: businessUnitId ?? null,
        fundClassId: fundClassId ?? null,
        projectId: projectId ?? null,
        grantId: grantId ?? null,
      },
      costCenters,
      summary: {
        totalCostCenters: costCenters.length,
        grandTotal,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
