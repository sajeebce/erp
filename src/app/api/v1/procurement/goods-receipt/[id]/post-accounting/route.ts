import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

const PROCUREMENT_GRN_SOURCE = 'PROCUREMENT_GRN'

type PostingItemType = 'INVENTORY' | 'FIXED_ASSET' | 'SERVICE_OR_EXPENSE'

type PostingAccount = {
  id: string
  code: string
  name: string
  type: string
}

function postingLabelFor(itemType: PostingItemType) {
  switch (itemType) {
    case 'INVENTORY':
      return 'inventory'
    case 'FIXED_ASSET':
      return 'fixed asset'
    case 'SERVICE_OR_EXPENSE':
      return 'service/expense'
  }
}

function accountTypeFor(itemType: PostingItemType) {
  return itemType === 'SERVICE_OR_EXPENSE' ? 'EXPENSE' : 'ASSET'
}

function pickAssetFallback(accounts: PostingAccount[], preferredNames: RegExp[]) {
  for (const pattern of preferredNames) {
    const match = accounts.find((account) => pattern.test(`${account.code} ${account.name}`))
    if (match) return match
  }

  return accounts[0] ?? null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const grn = await prisma.goodsReceipt.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
      },
      include: {
        vendor: { select: { companyName: true } },
        purchaseOrder: { select: { poNo: true } },
        lines: {
          include: {
            poLine: {
              select: {
                unitPrice: true,
                description: true,
                budgetLineId: true,
                businessUnitId: true,
                costCenterId: true,
                fundClassId: true,
                projectId: true,
                grantId: true,
              },
            },
          },
        },
      },
    })

    if (!grn) {
      return apiNotFound('Goods receipt not found')
    }

    if (grn.status !== 'ACCEPTED' && grn.status !== 'PARTIAL') {
      return apiBadRequest('Only ACCEPTED or PARTIAL goods receipts can be posted to accounting')
    }

    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        sourceModule: PROCUREMENT_GRN_SOURCE,
        sourceId: grn.id,
        deletedAt: null,
      },
      select: { id: true, entryNo: true, status: true },
    })

    if (existingEntry) {
      return apiBadRequest(`Accounting already posted for this GRN as ${existingEntry.entryNo}`)
    }

    const amount = grn.lines.reduce(
      (sum, line) => sum + Number(line.quantityAccepted) * Number(line.poLine.unitPrice),
      0
    )

    if (amount <= 0) {
      return apiBadRequest('Accepted amount must be greater than zero')
    }

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        organizationId: auth.organizationId,
        startDate: { lte: grn.date },
        endDate: { gte: grn.date },
        isClosed: false,
      },
      orderBy: { startDate: 'desc' },
    })

    if (!fiscalYear) {
      return apiBadRequest('No open fiscal year found for the GRN date')
    }

    const acceptedLines = grn.lines
      .map((line) => ({
        id: line.id,
        itemType: line.itemType as PostingItemType,
        description: line.description || line.poLine.description,
        accountId: line.accountId,
        amount: Number(line.quantityAccepted) * Number(line.poLine.unitPrice),
        poLine: line.poLine,
      }))
      .filter((line) => line.amount > 0)

    const explicitAccountIds = [...new Set(acceptedLines.map((line) => line.accountId).filter(Boolean) as string[])]
    const budgetLineIds = [...new Set(acceptedLines.map((line) => line.poLine.budgetLineId).filter(Boolean) as string[])]
    const [explicitAccounts, budgetLines, assetAccounts, expenseAccounts, liabilityAccounts] = await Promise.all([
      explicitAccountIds.length
        ? prisma.account.findMany({
            where: {
              id: { in: explicitAccountIds },
              organizationId: auth.organizationId,
              isActive: true,
              isGroup: false,
              deletedAt: null,
            },
            select: { id: true, code: true, name: true, type: true },
          })
        : Promise.resolve([]),
      budgetLineIds.length
        ? prisma.budgetLine.findMany({
            where: {
              id: { in: budgetLineIds },
              budget: {
                OR: [
                  { project: { organizationId: auth.organizationId } },
                  { businessUnit: { organizationId: auth.organizationId } },
                ],
              },
            },
            select: {
              id: true,
              account: { select: { id: true, code: true, name: true, type: true } },
            },
          })
        : Promise.resolve([]),
      prisma.account.findMany({
        where: {
          organizationId: auth.organizationId,
          type: 'ASSET',
          nature: 'DEBIT',
          isActive: true,
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true, code: true, name: true, type: true },
        orderBy: { code: 'asc' },
      }),
      prisma.account.findMany({
        where: {
          organizationId: auth.organizationId,
          type: 'EXPENSE',
          nature: 'DEBIT',
          isActive: true,
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true, code: true, name: true, type: true },
        orderBy: { code: 'asc' },
      }),
      prisma.account.findMany({
        where: {
          organizationId: auth.organizationId,
          type: 'LIABILITY',
          nature: 'CREDIT',
          isActive: true,
          isGroup: false,
          deletedAt: null,
        },
        select: { id: true, code: true, name: true, type: true },
        orderBy: { code: 'asc' },
      }),
    ])

    const explicitAccountById = new Map(explicitAccounts.map((account) => [account.id, account]))
    const budgetLineAccountById = new Map(budgetLines.map((line) => [line.id, line.account]))
    const accountsPayableAccount =
      liabilityAccounts.find((account) => account.code === '2101') ??
      liabilityAccounts.find((account) => account.code === '201002') ??
      liabilityAccounts.find((account) => /payable|supplier|sundry creditor/i.test(account.name)) ??
      liabilityAccounts[0] ??
      null

    if (!accountsPayableAccount) {
      return apiBadRequest('No active liability account found for Accounts Payable posting')
    }

    const inventoryFallback = pickAssetFallback(assetAccounts, [/inventory/i, /stock/i])
    const fixedAssetFallback = pickAssetFallback(assetAccounts, [/fixed asset/i, /^401/i, /equipment/i])
    const expenseFallback = expenseAccounts[0] ?? null

    const debitLines = acceptedLines.map((line) => {
      const explicitAccount = line.accountId ? explicitAccountById.get(line.accountId) : null
      const budgetLineAccount = line.poLine.budgetLineId ? budgetLineAccountById.get(line.poLine.budgetLineId) : null
      const fallbackAccount =
        line.itemType === 'INVENTORY'
          ? inventoryFallback
          : line.itemType === 'FIXED_ASSET'
            ? fixedAssetFallback
            : expenseFallback

      const account = explicitAccount ?? budgetLineAccount ?? fallbackAccount
      if (!account) {
        throw new Error(`No active ${accountTypeFor(line.itemType).toLowerCase()} account found for ${postingLabelFor(line.itemType)} line "${line.description}"`)
      }

      const expectedType = accountTypeFor(line.itemType)
      if (account.type !== expectedType) {
        throw new Error(
          `Account ${account.code} (${account.name}) is ${account.type}, but ${postingLabelFor(line.itemType)} line "${line.description}" requires ${expectedType}`
        )
      }

      return {
        ...line,
        account,
      }
    })

    const entryNo = await generateNextNumber(auth.organizationId, 'journal_entry')
    const firstDebitLine = debitLines[0]?.poLine

    const entry = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.journalEntry.findFirst({
        where: {
          sourceModule: PROCUREMENT_GRN_SOURCE,
          sourceId: grn.id,
          deletedAt: null,
        },
        select: { entryNo: true },
      })

      if (duplicate) {
        throw new Error(`Accounting already posted for this GRN as ${duplicate.entryNo}`)
      }

      return tx.journalEntry.create({
        data: {
          entryNo,
          date: grn.date,
          description: `Procurement goods receipt ${grn.grnNo}`,
          reference: `${grn.purchaseOrder.poNo} / ${grn.grnNo}`,
          fiscalYearId: fiscalYear.id,
          projectId: firstDebitLine?.projectId || null,
          grantId: firstDebitLine?.grantId || null,
          businessUnitId: firstDebitLine?.businessUnitId || null,
          totalDebit: new Prisma.Decimal(amount),
          totalCredit: new Prisma.Decimal(amount),
          status: 'APPROVED',
          isAutoGenerated: true,
          sourceModule: PROCUREMENT_GRN_SOURCE,
          sourceId: grn.id,
          notes: `Auto-posted from procurement goods receipt for ${grn.vendor.companyName}`,
          createdById: auth.userId,
          approvedById: auth.userId,
          approvedAt: new Date(),
          postedAt: new Date(),
          lines: {
            create: [
              ...debitLines.map((line) => ({
                accountId: line.account.id,
                budgetLineId: line.poLine.budgetLineId || null,
                projectId: line.poLine.projectId || null,
                businessUnitId: line.poLine.businessUnitId || null,
                costCenterId: line.poLine.costCenterId || null,
                fundClassId: line.poLine.fundClassId || null,
                description: `DR ${postingLabelFor(line.itemType)} for ${grn.grnNo} - ${line.description}`,
                debit: new Prisma.Decimal(line.amount),
                credit: new Prisma.Decimal(0),
              })),
              {
                accountId: accountsPayableAccount.id,
                description: `CR accounts payable for ${grn.vendor.companyName}`,
                projectId: firstDebitLine?.projectId || null,
                businessUnitId: firstDebitLine?.businessUnitId || null,
                costCenterId: firstDebitLine?.costCenterId || null,
                fundClassId: firstDebitLine?.fundClassId || null,
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(amount),
              },
            ],
          },
        },
        include: {
          lines: {
            include: {
              account: { select: { code: true, name: true, type: true } },
            },
          },
        },
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'FINANCE',
      resource: 'JournalEntry',
      resourceId: entry.id,
      description: `Posted accounting entry ${entryNo} for goods receipt ${grn.grnNo}`,
      newValues: {
        entryNo,
        grnId: grn.id,
        amount,
        debitLines: debitLines.map((line) => ({
          itemType: line.itemType,
          accountId: line.account.id,
          accountCode: line.account.code,
          amount: line.amount,
        })),
        accountsPayableAccountId: accountsPayableAccount.id,
        accountsPayableAccountCode: accountsPayableAccount.code,
      },
      ...auditCtx,
    })

    return apiSuccess(entry)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
      if (target.includes('sourceModule') && target.includes('sourceId')) {
        return apiConflict('Accounting already posted for this GRN')
      }
    }
    return handleRouteError(error)
  }
}
