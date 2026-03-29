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
import { generateNextNumber } from '@/lib/number-sequence'

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

    // Auto-create JournalEntry for total depreciation amount
    if (records.length > 0) {
      const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
      const now = new Date()

      const fiscalYear = await prisma.fiscalYear.findFirst({
        where: { organizationId: auth.organizationId, isCurrent: true },
      })

      if (fiscalYear) {
        const entryNo = await generateNextNumber(auth.organizationId, 'journal_entry')

        // Find depreciation expense account (debit)
        const debitAccount = await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            type: 'EXPENSE',
            isActive: true,
            deletedAt: null,
            OR: [
              { name: { contains: 'depreciation', mode: 'insensitive' } },
              { name: { contains: 'Depreciation', mode: 'insensitive' } },
            ],
          },
        }) ?? await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            type: 'EXPENSE',
            isActive: true,
            isGroup: false,
            deletedAt: null,
          },
        })

        // Find accumulated depreciation account (credit)
        const creditAccount = await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            type: 'ASSET',
            isActive: true,
            deletedAt: null,
            OR: [
              { name: { contains: 'accumulated', mode: 'insensitive' } },
              { name: { contains: 'depreciation', mode: 'insensitive' } },
            ],
          },
        }) ?? await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            type: 'ASSET',
            isActive: true,
            isGroup: false,
            deletedAt: null,
          },
        })

        if (debitAccount && creditAccount) {
          await prisma.$transaction([
            prisma.journalEntry.create({
              data: {
                entryNo,
                date: now,
                description: `Depreciation for ${month}/${year} — ${records.length} assets`,
                fiscalYearId: fiscalYear.id,
                totalDebit: new Prisma.Decimal(totalAmount),
                totalCredit: new Prisma.Decimal(totalAmount),
                status: 'APPROVED',
                isAutoGenerated: true,
                sourceModule: 'depreciation',
                postedAt: now,
                createdById: auth.userId,
                approvedById: auth.userId,
                approvedAt: now,
                lines: {
                  create: [
                    {
                      accountId: debitAccount.id,
                      description: 'Depreciation Expense',
                      debit: new Prisma.Decimal(totalAmount),
                      credit: new Prisma.Decimal(0),
                    },
                    {
                      accountId: creditAccount.id,
                      description: 'Accumulated Depreciation',
                      debit: new Prisma.Decimal(0),
                      credit: new Prisma.Decimal(totalAmount),
                    },
                  ],
                },
              },
            }),
          ])
        }
      }
    }

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
