import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { month, year } = body
    if (!month || !year) {
      return apiBadRequest('month and year are required')
    }

    const period = new Date(year, month - 1, 1)

    // Get all active assets for this org
    const assets = await prisma.asset.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        disposedAt: null,
        category: { organizationId: auth.organizationId },
      },
      include: { category: true },
    })

    const records: { assetId: string; amount: number }[] = []

    for (const asset of assets) {
      // Skip if depreciation already run for this period
      const existing = await prisma.assetDepreciation.findFirst({
        where: { assetId: asset.id, period },
      })
      if (existing) continue

      const nbv = Number(asset.netBookValue)
      if (nbv <= 0) continue

      const rate = Number(asset.category.depreciationRate)
      let depAmount = 0

      if (asset.category.depreciationMethod === 'STRAIGHT_LINE') {
        // Annual rate / 12 months
        depAmount = (Number(asset.purchasePrice) * rate) / 100 / 12
      } else {
        // DECLINING_BALANCE: apply rate to current NBV
        depAmount = (nbv * rate) / 100 / 12
      }

      // Don't depreciate below zero
      depAmount = Math.min(depAmount, nbv)
      depAmount = Math.round(depAmount * 100) / 100

      if (depAmount <= 0) continue

      const openingValue = nbv
      const closingValue = nbv - depAmount

      await prisma.$transaction([
        prisma.assetDepreciation.create({
          data: {
            assetId: asset.id,
            period,
            openingValue: new Prisma.Decimal(openingValue),
            depreciationAmount: new Prisma.Decimal(depAmount),
            closingValue: new Prisma.Decimal(closingValue),
          },
        }),
        prisma.asset.update({
          where: { id: asset.id },
          data: {
            accumulatedDepreciation: { increment: depAmount },
            netBookValue: new Prisma.Decimal(closingValue),
          },
        }),
      ])

      records.push({ assetId: asset.id, amount: depAmount })
    }

    // TODO: Auto-create JournalEntry for total depreciation amount per run.
    // DR Depreciation Expense, CR Accumulated Depreciation.
    // Skipped for now — depreciation records are created correctly above.
    // JE can be created manually or this will be added when the org has
    // standardized depreciation expense / accumulated depreciation accounts.

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset_depreciation',
      description: `Ran depreciation for ${month}/${year} — ${records.length} assets processed`,
      newValues: { month, year, assetsProcessed: records.length },
      ...auditCtx,
    })

    return apiSuccess({ month, year, assetsProcessed: records.length, records })
  } catch (error) {
    return handleRouteError(error)
  }
}
