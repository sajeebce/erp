import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import type { AccessTokenPayload } from '@/lib/auth/jwt'

// ─── Types ───

interface ReportFilters {
  fiscalYearId: string
  organizationId: string
  startDate?: Date
  endDate?: Date
  projectId?: string
}

interface AccountBalance {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  totalDebit: number
  totalCredit: number
}

// ─── Main Handler ───

const VALID_REPORT_TYPES = [
  'trial-balance',
  'income-statement',
  'balance-sheet',
  'cash-flow',
  'fund-position',
  'ledger',
  'day-book',
  'bank-book',
  'cash-book',
  'receipts-payments',
  'fund-balance-changes',
  'grant-financial',
  'bank-reconciliation-statement',
] as const

type ReportType = typeof VALID_REPORT_TYPES[number]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { type } = await params

    if (!VALID_REPORT_TYPES.includes(type as ReportType)) {
      return apiBadRequest(
        `Invalid report type. Must be one of: ${VALID_REPORT_TYPES.join(', ')}`
      )
    }

    const url = new URL(request.url)
    const fiscalYearId = url.searchParams.get('fiscalYearId')

    if (!fiscalYearId) {
      return apiBadRequest('fiscalYearId is required')
    }

    // Verify fiscal year belongs to this org
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: fiscalYearId,
        organizationId: auth.organizationId,
      },
    })

    if (!fiscalYear) {
      return apiNotFound('Fiscal year not found in this organization')
    }

    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')
    const projectId = url.searchParams.get('projectId') || undefined

    const filters: ReportFilters = {
      fiscalYearId,
      organizationId: auth.organizationId,
      startDate: startDateParam ? new Date(startDateParam) : fiscalYear.startDate,
      endDate: endDateParam ? new Date(endDateParam) : fiscalYear.endDate,
      projectId,
    }

    const reportType = type as ReportType

    switch (reportType) {
      case 'trial-balance':
        return apiSuccess(await generateTrialBalance(filters, auth))
      case 'income-statement':
        return apiSuccess(await generateIncomeStatement(filters, auth))
      case 'balance-sheet':
        return apiSuccess(await generateBalanceSheet(filters, auth))
      case 'cash-flow':
        return apiSuccess(await generateCashFlow(filters, auth))
      case 'fund-position':
        return apiSuccess(await generateFundPosition(filters, auth))
      case 'ledger':
        return apiSuccess(await generateLedger(filters, auth, url))
      case 'day-book':
        return apiSuccess(await generateDayBook(filters, auth))
      case 'bank-book':
        return apiSuccess(await generateBankBook(filters, auth))
      case 'cash-book':
        return apiSuccess(await generateCashBook(filters, auth))
      case 'receipts-payments':
        return apiSuccess(await generateReceiptsPayments(filters, auth))
      case 'fund-balance-changes':
        return apiSuccess(await generateFundBalanceChanges(filters, auth))
      case 'grant-financial':
        return apiSuccess(await generateGrantFinancial(filters, auth, url))
      case 'bank-reconciliation-statement':
        return apiSuccess(await generateBankReconciliationStatement(filters, auth, url))
      default:
        return apiBadRequest('Invalid report type')
    }
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── Shared Helpers ───

async function getAccountBalances(filters: ReportFilters, accountTypes?: string[]): Promise<AccountBalance[]> {
  const accountWhere: Record<string, unknown> = {
    organizationId: filters.organizationId,
    deletedAt: null,
    isGroup: false,
  }

  if (accountTypes && accountTypes.length > 0) {
    accountWhere.type = { in: accountTypes }
  }

  if (filters.projectId) {
    accountWhere.projectId = filters.projectId
  }

  const accounts = await prisma.account.findMany({
    where: accountWhere,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      nature: true,
      journalLines: {
        where: {
          journalEntry: {
            status: 'APPROVED',
            deletedAt: null,
            fiscalYearId: filters.fiscalYearId,
            ...(filters.startDate && filters.endDate
              ? {
                  date: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                  },
                }
              : {}),
            ...(filters.projectId ? { projectId: filters.projectId } : {}),
          },
        },
        select: {
          debit: true,
          credit: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  })

  return accounts
    .map((account) => {
      const totalDebit = account.journalLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0
      )
      const totalCredit = account.journalLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0
      )

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        totalDebit,
        totalCredit,
      }
    })
    .filter((a) => a.totalDebit !== 0 || a.totalCredit !== 0)
}

// ─── Trial Balance ───

async function generateTrialBalance(filters: ReportFilters, _auth: AccessTokenPayload) {
  const balances = await getAccountBalances(filters)

  const accounts = balances.map((account) => {
    const closingDebit =
      account.totalDebit > account.totalCredit
        ? account.totalDebit - account.totalCredit
        : 0
    const closingCredit =
      account.totalCredit > account.totalDebit
        ? account.totalCredit - account.totalDebit
        : 0

    return {
      accountId: account.accountId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: account.accountType,
      periodDebit: account.totalDebit,
      periodCredit: account.totalCredit,
      closingDebit,
      closingCredit,
    }
  })

  const totalPeriodDebit = accounts.reduce((sum, a) => sum + a.periodDebit, 0)
  const totalPeriodCredit = accounts.reduce((sum, a) => sum + a.periodCredit, 0)
  const totalClosingDebit = accounts.reduce((sum, a) => sum + a.closingDebit, 0)
  const totalClosingCredit = accounts.reduce((sum, a) => sum + a.closingCredit, 0)

  return {
    reportType: 'trial-balance',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    accounts,
    totals: {
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingDebit: totalClosingDebit,
      closingCredit: totalClosingCredit,
      isBalanced: Math.abs(totalPeriodDebit - totalPeriodCredit) < 0.01,
    },
  }
}

// ─── Income Statement ───

async function generateIncomeStatement(filters: ReportFilters, _auth: AccessTokenPayload) {
  const [incomeBalances, expenseBalances] = await Promise.all([
    getAccountBalances(filters, ['INCOME']),
    getAccountBalances(filters, ['EXPENSE']),
  ])

  const incomeAccounts = incomeBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    amount: a.totalCredit - a.totalDebit, // Income: credits > debits
  }))

  const expenseAccounts = expenseBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    amount: a.totalDebit - a.totalCredit, // Expense: debits > credits
  }))

  const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.amount, 0)
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.amount, 0)
  const netSurplusDeficit = totalIncome - totalExpenses

  return {
    reportType: 'income-statement',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    income: {
      accounts: incomeAccounts,
      total: totalIncome,
    },
    expenses: {
      accounts: expenseAccounts,
      total: totalExpenses,
    },
    netSurplusDeficit,
  }
}

// ─── Balance Sheet ───

async function generateBalanceSheet(filters: ReportFilters, _auth: AccessTokenPayload) {
  const [assetBalances, liabilityBalances, equityBalances] = await Promise.all([
    getAccountBalances(filters, ['ASSET']),
    getAccountBalances(filters, ['LIABILITY']),
    getAccountBalances(filters, ['EQUITY']),
  ])

  const assetAccounts = assetBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    balance: a.totalDebit - a.totalCredit, // Assets: debit nature
  }))

  const liabilityAccounts = liabilityBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    balance: a.totalCredit - a.totalDebit, // Liabilities: credit nature
  }))

  const equityAccounts = equityBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    balance: a.totalCredit - a.totalDebit, // Equity: credit nature
  }))

  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0)
  const totalEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0)

  // Include net surplus/deficit from income statement in equity
  const [incomeBalances, expenseBalances] = await Promise.all([
    getAccountBalances(filters, ['INCOME']),
    getAccountBalances(filters, ['EXPENSE']),
  ])

  const totalIncome = incomeBalances.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0)
  const totalExpenses = expenseBalances.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0)
  const netSurplusDeficit = totalIncome - totalExpenses

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + netSurplusDeficit

  return {
    reportType: 'balance-sheet',
    fiscalYearId: filters.fiscalYearId,
    asOfDate: filters.endDate,
    generatedAt: new Date(),
    assets: {
      accounts: assetAccounts,
      total: totalAssets,
    },
    liabilities: {
      accounts: liabilityAccounts,
      total: totalLiabilities,
    },
    equity: {
      accounts: equityAccounts,
      total: totalEquity,
      netSurplusDeficit,
      totalWithSurplus: totalEquity + netSurplusDeficit,
    },
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
  }
}

// ─── Cash Flow (simplified) ───

async function generateCashFlow(filters: ReportFilters, _auth: AccessTokenPayload) {
  const [incomeBalances, expenseBalances] = await Promise.all([
    getAccountBalances(filters, ['INCOME']),
    getAccountBalances(filters, ['EXPENSE']),
  ])

  const totalIncome = incomeBalances.reduce(
    (sum, a) => sum + (a.totalCredit - a.totalDebit),
    0
  )
  const totalExpenses = expenseBalances.reduce(
    (sum, a) => sum + (a.totalDebit - a.totalCredit),
    0
  )

  const netOperatingCashFlow = totalIncome - totalExpenses

  const incomeDetails = incomeBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    amount: a.totalCredit - a.totalDebit,
  }))

  const expenseDetails = expenseBalances.map((a) => ({
    accountId: a.accountId,
    accountCode: a.accountCode,
    accountName: a.accountName,
    amount: a.totalDebit - a.totalCredit,
  }))

  return {
    reportType: 'cash-flow',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    operatingActivities: {
      inflows: {
        accounts: incomeDetails,
        total: totalIncome,
      },
      outflows: {
        accounts: expenseDetails,
        total: totalExpenses,
      },
      net: netOperatingCashFlow,
    },
    netCashFlow: netOperatingCashFlow,
  }
}

// ─── Fund Position ───

async function generateFundPosition(filters: ReportFilters, _auth: AccessTokenPayload) {
  // Get all grants with journal entries in this fiscal year for this org
  const grants = await prisma.grant.findMany({
    where: {
      donor: {
        organizationId: filters.organizationId,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      grantNo: true,
      title: true,
      awardAmount: true,
      disbursedAmount: true,
      currencyCode: true,
      status: true,
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // For each grant, compute income and expense from journal entries tagged to that grant
  const fundPositions = await Promise.all(
    grants.map(async (grant) => {
      const journalLineWhere: Record<string, unknown> = {
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
          fiscalYearId: filters.fiscalYearId,
          grantId: grant.id,
          ...(filters.startDate && filters.endDate
            ? {
                date: {
                  gte: filters.startDate,
                  lte: filters.endDate,
                },
              }
            : {}),
          ...(filters.projectId ? { projectId: filters.projectId } : {}),
        },
      }

      // Income JEs for this grant (INCOME account lines)
      const incomeAgg = await prisma.journalEntryLine.aggregate({
        where: {
          ...journalLineWhere,
          account: { type: 'INCOME' },
        },
        _sum: {
          debit: true,
          credit: true,
        },
      })

      // Expense JEs for this grant (EXPENSE account lines)
      const expenseAgg = await prisma.journalEntryLine.aggregate({
        where: {
          ...journalLineWhere,
          account: { type: 'EXPENSE' },
        },
        _sum: {
          debit: true,
          credit: true,
        },
      })

      const totalIncome =
        Number(incomeAgg._sum.credit ?? 0) - Number(incomeAgg._sum.debit ?? 0)
      const totalExpenses =
        Number(expenseAgg._sum.debit ?? 0) - Number(expenseAgg._sum.credit ?? 0)
      const fundBalance = totalIncome - totalExpenses

      return {
        grantId: grant.id,
        grantNo: grant.grantNo,
        grantTitle: grant.title,
        grantStatus: grant.status,
        donorId: grant.donor.id,
        donorName: grant.donor.name,
        awardAmount: Number(grant.awardAmount),
        disbursedAmount: Number(grant.disbursedAmount),
        currencyCode: grant.currencyCode,
        totalIncome,
        totalExpenses,
        fundBalance,
        utilizationRate: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
      }
    })
  )

  // Filter out grants with no activity
  const activePositions = fundPositions.filter(
    (p) => p.totalIncome !== 0 || p.totalExpenses !== 0
  )

  const totalIncome = activePositions.reduce((sum, p) => sum + p.totalIncome, 0)
  const totalExpenses = activePositions.reduce((sum, p) => sum + p.totalExpenses, 0)
  const totalFundBalance = activePositions.reduce((sum, p) => sum + p.fundBalance, 0)

  return {
    reportType: 'fund-position',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    grants: activePositions,
    summary: {
      totalGrants: activePositions.length,
      totalIncome,
      totalExpenses,
      totalFundBalance,
      overallUtilizationRate: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
    },
  }
}

// ─── Ledger (General Ledger — per-account or specific account) ───

async function generateLedger(filters: ReportFilters, _auth: AccessTokenPayload, url: URL) {
  const accountId = url.searchParams.get('accountId')

  const jeWhere = {
    status: 'APPROVED' as const,
    deletedAt: null,
    fiscalYearId: filters.fiscalYearId,
    ...(filters.startDate && filters.endDate ? { date: { gte: filters.startDate, lte: filters.endDate } } : {}),
  }

  if (accountId) {
    // Single account ledger — show all lines with running balance
    const lines = await prisma.journalEntryLine.findMany({
      where: { accountId, journalEntry: jeWhere },
      select: {
        debit: true, credit: true, description: true,
        account: { select: { code: true, name: true, nature: true } },
        journalEntry: { select: { entryNo: true, date: true, description: true, reference: true } },
      },
      orderBy: { journalEntry: { date: 'asc' } },
      take: 500,
    })

    const accountInfo = lines[0]?.account
    const isDebitNature = accountInfo?.nature === 'DEBIT'

    let runningBalance = 0
    const entries = lines.map(l => {
      const debit = Number(l.debit)
      const credit = Number(l.credit)
      // For debit-nature accounts (ASSET, EXPENSE): balance increases with debit
      // For credit-nature accounts (LIABILITY, INCOME, EQUITY): balance increases with credit
      runningBalance += isDebitNature ? (debit - credit) : (credit - debit)
      return {
        date: l.journalEntry.date,
        entryNo: l.journalEntry.entryNo,
        description: l.description || l.journalEntry.description,
        reference: l.journalEntry.reference,
        debit, credit,
        balance: runningBalance,
      }
    })

    return {
      reportType: 'ledger', mode: 'single',
      fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate,
      generatedAt: new Date(),
      accountId, accountCode: accountInfo?.code, accountName: accountInfo?.name,
      entries,
      totalDebit: entries.reduce((s, e) => s + e.debit, 0),
      totalCredit: entries.reduce((s, e) => s + e.credit, 0),
      closingBalance: runningBalance,
    }
  }

  // All accounts summary — show per-account totals (not individual lines)
  const accounts = await prisma.account.findMany({
    where: { organizationId: filters.organizationId, isGroup: false, deletedAt: null },
    select: {
      id: true, code: true, name: true, type: true, nature: true,
      journalLines: {
        where: { journalEntry: jeWhere },
        select: { debit: true, credit: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  const entries = accounts
    .map(acc => {
      const totalDebit = acc.journalLines.reduce((s, l) => s + Number(l.debit), 0)
      const totalCredit = acc.journalLines.reduce((s, l) => s + Number(l.credit), 0)
      const isDebitNature = acc.nature === 'DEBIT'
      const balance = isDebitNature ? (totalDebit - totalCredit) : (totalCredit - totalDebit)
      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      }
    })
    .filter(a => a.debit !== 0 || a.credit !== 0)

  return {
    reportType: 'ledger', mode: 'summary',
    fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate,
    generatedAt: new Date(),
    accountId: 'all',
    accounts: entries,
    totalDebit: entries.reduce((s, e) => s + e.debit, 0),
    totalCredit: entries.reduce((s, e) => s + e.credit, 0),
  }
}

// ─── Day Book (all transactions by date) ───

async function generateDayBook(filters: ReportFilters, _auth: AccessTokenPayload) {
  const entries = await prisma.journalEntry.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      fiscalYearId: filters.fiscalYearId,
      ...(filters.startDate && filters.endDate ? { date: { gte: filters.startDate, lte: filters.endDate } } : {}),
    },
    select: {
      entryNo: true,
      date: true,
      description: true,
      reference: true,
      totalDebit: true,
      totalCredit: true,
      lines: {
        select: {
          account: { select: { code: true, name: true } },
          debit: true,
          credit: true,
          description: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  const totalDebit = entries.reduce((s, e) => s + Number(e.totalDebit), 0)
  const totalCredit = entries.reduce((s, e) => s + Number(e.totalCredit), 0)

  return { reportType: 'day-book', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), entries: entries.map(e => ({ ...e, totalDebit: Number(e.totalDebit), totalCredit: Number(e.totalCredit), lines: e.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })) })), summary: { totalEntries: entries.length, totalDebit, totalCredit } }
}

// ─── Bank Book (transactions for bank accounts only) ───

async function generateBankBook(filters: ReportFilters, _auth: AccessTokenPayload) {
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      account: { organizationId: filters.organizationId, isBankAccount: true, deletedAt: null },
      journalEntry: {
        status: 'APPROVED', deletedAt: null, fiscalYearId: filters.fiscalYearId,
        ...(filters.startDate && filters.endDate ? { date: { gte: filters.startDate, lte: filters.endDate } } : {}),
      },
    },
    select: {
      debit: true, credit: true, description: true,
      account: { select: { code: true, name: true } },
      journalEntry: { select: { entryNo: true, date: true, description: true, reference: true } },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  })

  let runningBalance = 0
  const entries = lines.map(l => {
    const debit = Number(l.debit); const credit = Number(l.credit)
    runningBalance += debit - credit
    return { date: l.journalEntry.date, entryNo: l.journalEntry.entryNo, description: l.description || l.journalEntry.description, reference: l.journalEntry.reference, accountCode: l.account.code, accountName: l.account.name, debit, credit, balance: runningBalance }
  })

  return { reportType: 'bank-book', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), entries, totalDebit: entries.reduce((s, e) => s + e.debit, 0), totalCredit: entries.reduce((s, e) => s + e.credit, 0), closingBalance: runningBalance }
}

// ─── Cash Book (transactions for cash accounts — non-bank asset accounts) ───

async function generateCashBook(filters: ReportFilters, _auth: AccessTokenPayload) {
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      account: { organizationId: filters.organizationId, type: 'ASSET', isBankAccount: false, isGroup: false, deletedAt: null },
      journalEntry: {
        status: 'APPROVED', deletedAt: null, fiscalYearId: filters.fiscalYearId,
        ...(filters.startDate && filters.endDate ? { date: { gte: filters.startDate, lte: filters.endDate } } : {}),
      },
    },
    select: {
      debit: true, credit: true, description: true,
      account: { select: { code: true, name: true } },
      journalEntry: { select: { entryNo: true, date: true, description: true, reference: true } },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  })

  let runningBalance = 0
  const entries = lines.map(l => {
    const debit = Number(l.debit); const credit = Number(l.credit)
    runningBalance += debit - credit
    return { date: l.journalEntry.date, entryNo: l.journalEntry.entryNo, description: l.description || l.journalEntry.description, reference: l.journalEntry.reference, accountCode: l.account.code, accountName: l.account.name, debit, credit, balance: runningBalance }
  })

  return { reportType: 'cash-book', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), entries, totalDebit: entries.reduce((s, e) => s + e.debit, 0), totalCredit: entries.reduce((s, e) => s + e.credit, 0), closingBalance: runningBalance }
}

// ─── Receipts & Payments Statement ───

async function generateReceiptsPayments(filters: ReportFilters, _auth: AccessTokenPayload) {
  const incomeBalances = await getAccountBalances(filters, ['INCOME'])
  const expenseBalances = await getAccountBalances(filters, ['EXPENSE'])

  const receipts = incomeBalances.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, amount: a.totalCredit - a.totalDebit })).filter(a => a.amount !== 0)
  const payments = expenseBalances.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, amount: a.totalDebit - a.totalCredit })).filter(a => a.amount !== 0)

  const totalReceipts = receipts.reduce((s, r) => s + r.amount, 0)
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0)

  return { reportType: 'receipts-payments', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), receipts, payments, summary: { totalReceipts, totalPayments, netSurplus: totalReceipts - totalPayments } }
}

// ─── Statement of Changes in Fund Balances (IPSAS mandatory) ───

async function generateFundBalanceChanges(filters: ReportFilters, _auth: AccessTokenPayload) {
  const equityBalances = await getAccountBalances(filters, ['EQUITY'])
  const incomeBalances = await getAccountBalances(filters, ['INCOME'])
  const expenseBalances = await getAccountBalances(filters, ['EXPENSE'])

  const totalIncome = incomeBalances.reduce((s, a) => s + (a.totalCredit - a.totalDebit), 0)
  const totalExpenses = expenseBalances.reduce((s, a) => s + (a.totalDebit - a.totalCredit), 0)
  const netSurplus = totalIncome - totalExpenses

  const openingFundBalance = equityBalances.reduce((s, a) => s + (a.totalCredit - a.totalDebit), 0)
  const closingFundBalance = openingFundBalance + netSurplus

  // Get grant-wise breakdown
  const grants = await prisma.grant.findMany({
    where: { donor: { organizationId: filters.organizationId } },
    select: { id: true, title: true, grantNo: true, awardAmount: true, disbursedAmount: true },
  })

  return { reportType: 'fund-balance-changes', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), openingFundBalance, totalIncome, totalExpenses, netSurplus, closingFundBalance, equityAccounts: equityBalances.map(a => ({ accountCode: a.accountCode, accountName: a.accountName, balance: a.totalCredit - a.totalDebit })), grantsSummary: grants.map(g => ({ grantNo: g.grantNo, title: g.title, awardAmount: Number(g.awardAmount), disbursedAmount: Number(g.disbursedAmount) })) }
}

// ─── Grant-wise Financial Report ───

async function generateGrantFinancial(filters: ReportFilters, _auth: AccessTokenPayload, url: URL) {
  const grantId = url.searchParams.get('grantId')

  const grantWhere: Record<string, unknown> = { donor: { organizationId: filters.organizationId } }
  if (grantId) grantWhere.id = grantId

  const grants = await prisma.grant.findMany({
    where: grantWhere,
    select: {
      id: true, title: true, grantNo: true, awardAmount: true, disbursedAmount: true, startDate: true, endDate: true,
      donor: { select: { name: true } },
      journalEntries: {
        where: { status: 'APPROVED', deletedAt: null, fiscalYearId: filters.fiscalYearId },
        select: {
          totalDebit: true, totalCredit: true,
          lines: { select: { debit: true, credit: true, account: { select: { code: true, name: true, type: true } } } },
        },
      },
    },
  })

  const grantReports = grants.map(g => {
    let totalIncome = 0, totalExpense = 0
    for (const je of g.journalEntries) {
      for (const l of je.lines) {
        if (l.account.type === 'INCOME') totalIncome += Number(l.credit) - Number(l.debit)
        if (l.account.type === 'EXPENSE') totalExpense += Number(l.debit) - Number(l.credit)
      }
    }
    return {
      grantId: g.id, grantNo: g.grantNo, grantTitle: g.title, donorName: g.donor.name,
      awardAmount: Number(g.awardAmount), disbursedAmount: Number(g.disbursedAmount),
      startDate: g.startDate, endDate: g.endDate,
      totalIncome, totalExpenses: totalExpense, fundBalance: totalIncome - totalExpense,
      utilizationRate: totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0,
    }
  })

  return { reportType: 'grant-financial', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(), grants: grantReports, summary: { totalGrants: grantReports.length, totalAward: grantReports.reduce((s, g) => s + g.awardAmount, 0), totalDisbursed: grantReports.reduce((s, g) => s + g.disbursedAmount, 0), totalExpense: grantReports.reduce((s, g) => s + g.totalExpenses, 0) } }
}

// ─── Bank Reconciliation Statement (printable summary) ───

async function generateBankReconciliationStatement(filters: ReportFilters, _auth: AccessTokenPayload, url: URL) {
  const bankAccountId = url.searchParams.get('bankAccountId')

  const where: Record<string, unknown> = { bankAccount: { organizationId: filters.organizationId } }
  if (bankAccountId) where.bankAccountId = bankAccountId

  const reconciliations = await prisma.bankReconciliation.findMany({
    where: {
      ...where,
      periodStart: { gte: filters.startDate },
      periodEnd: { lte: filters.endDate },
    },
    select: {
      id: true, periodStart: true, periodEnd: true, bookBalance: true, bankBalance: true, difference: true, status: true, reconciledAt: true,
      bankAccount: { select: { accountCode: true, accountName: true, bankName: true } },
      items: { select: { date: true, description: true, bankAmount: true, bookAmount: true, isMatched: true, type: true } },
    },
    orderBy: { periodEnd: 'desc' },
  })

  return {
    reportType: 'bank-reconciliation-statement', fiscalYearId: filters.fiscalYearId, periodStart: filters.startDate, periodEnd: filters.endDate, generatedAt: new Date(),
    reconciliations: reconciliations.map(r => ({
      bankAccount: r.bankAccount, periodStart: r.periodStart, periodEnd: r.periodEnd,
      bookBalance: Number(r.bookBalance), bankBalance: Number(r.bankBalance), difference: Number(r.difference),
      status: r.status, reconciledAt: r.reconciledAt,
      totalItems: r.items.length,
      matchedItems: r.items.filter(i => i.isMatched).length,
      unmatchedItems: r.items.filter(i => !i.isMatched).map(i => ({ date: i.date, description: i.description, amount: Number(i.bankAmount), type: i.type })),
    })),
    summary: { totalReconciliations: reconciliations.length, reconciled: reconciliations.filter(r => r.status === 'RECONCILED').length, pending: reconciliations.filter(r => r.status === 'PENDING').length },
  }
}
