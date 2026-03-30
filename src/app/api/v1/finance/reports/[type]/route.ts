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
  'expense-summary',
  'advance-aging',
  'petty-cash-statement',
  'per-diem-utilization',
  'receipt-compliance',
  'tds-vds-register',
  'donor-expense-report',
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
      case 'expense-summary':
        return apiSuccess(await generateExpenseSummary(filters, auth))
      case 'advance-aging':
        return apiSuccess(await generateAdvanceAging(filters, auth))
      case 'petty-cash-statement':
        return apiSuccess(await generatePettyCashStatement(filters, auth))
      case 'per-diem-utilization':
        return apiSuccess(await generatePerDiemUtilization(filters, auth))
      case 'receipt-compliance':
        return apiSuccess(await generateReceiptCompliance(filters, auth))
      case 'tds-vds-register':
        return apiSuccess(await generateTdsVdsRegister(filters, auth))
      case 'donor-expense-report':
        return apiSuccess(await generateDonorExpenseReport(filters, auth, url))
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

// ─── Expense Summary ───

async function generateExpenseSummary(filters: ReportFilters, _auth: AccessTokenPayload) {
  const claims = await prisma.expenseClaim.findMany({
    where: {
      organizationId: filters.organizationId,
      status: { in: ['FINANCE_APPROVED', 'PAID'] },
      claimDate: {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      },
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    select: {
      id: true,
      claimNo: true,
      claimDate: true,
      totalAmount: true,
      approvedAmount: true,
      projectId: true,
      items: {
        select: {
          category: true,
          amount: true,
          approvedAmount: true,
          projectId: true,
        },
      },
    },
  })

  // Group by category
  const categoryMap: Record<string, { category: string; totalAmount: number; approvedAmount: number; count: number; projects: Record<string, number> }> = {}

  for (const claim of claims) {
    for (const item of claim.items) {
      const cat = item.category || 'Uncategorized'
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, totalAmount: 0, approvedAmount: 0, count: 0, projects: {} }
      }
      categoryMap[cat].totalAmount += Number(item.amount)
      categoryMap[cat].approvedAmount += Number(item.approvedAmount ?? item.amount)
      categoryMap[cat].count += 1

      const projId = item.projectId ?? claim.projectId ?? 'unallocated'
      categoryMap[cat].projects[projId] = (categoryMap[cat].projects[projId] || 0) + Number(item.amount)
    }
  }

  // Resolve project names
  const allProjectIds = [...new Set(claims.flatMap(c => [c.projectId, ...c.items.map(i => i.projectId)]).filter(Boolean))] as string[]
  const projects = allProjectIds.length > 0
    ? await prisma.project.findMany({ where: { id: { in: allProjectIds } }, select: { id: true, name: true, projectNo: true } })
    : []
  const projectNameMap: Record<string, string> = Object.fromEntries(projects.map(p => [p.id, `${p.projectNo} - ${p.name}`]))

  const categories = Object.values(categoryMap).map(c => ({
    category: c.category,
    totalAmount: c.totalAmount,
    approvedAmount: c.approvedAmount,
    count: c.count,
    projectBreakdown: Object.entries(c.projects).map(([pid, amt]) => ({
      projectId: pid,
      projectName: projectNameMap[pid] || 'Unallocated',
      amount: amt,
    })),
  })).sort((a, b) => b.totalAmount - a.totalAmount)

  const grandTotal = categories.reduce((s, c) => s + c.totalAmount, 0)
  const grandApproved = categories.reduce((s, c) => s + c.approvedAmount, 0)

  return {
    reportType: 'expense-summary',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    categories,
    summary: {
      totalCategories: categories.length,
      totalClaims: claims.length,
      grandTotal,
      grandApproved,
    },
  }
}

// ─── Advance Aging ───

async function generateAdvanceAging(filters: ReportFilters, _auth: AccessTokenPayload) {
  const advances = await prisma.employeeAdvance.findMany({
    where: {
      organizationId: filters.organizationId,
      status: { in: ['DISBURSED', 'PARTIALLY_SETTLED', 'OVERDUE'] },
      disbursedAt: {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      },
    },
    select: {
      id: true,
      advanceNo: true,
      employeeId: true,
      purpose: true,
      advanceType: true,
      disbursedAmount: true,
      settledAmount: true,
      disbursedAt: true,
      expectedSettlementDate: true,
      status: true,
    },
    orderBy: { disbursedAt: 'asc' },
  })

  // Resolve employee names
  const employeeIds = [...new Set(advances.map(a => a.employeeId))]
  const employees = employeeIds.length > 0
    ? await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, fullName: true } })
    : []
  const empNameMap: Record<string, string> = Object.fromEntries(employees.map(e => [e.id, e.fullName]))

  const now = new Date()

  const entries = advances.map(a => {
    const disbursed = Number(a.disbursedAmount ?? 0)
    const settled = Number(a.settledAmount ?? 0)
    const outstanding = disbursed - settled
    const daysAge = a.disbursedAt ? Math.floor((now.getTime() - new Date(a.disbursedAt).getTime()) / (24 * 60 * 60 * 1000)) : 0

    let bucket: string
    if (daysAge <= 30) bucket = '0-30'
    else if (daysAge <= 60) bucket = '31-60'
    else if (daysAge <= 90) bucket = '61-90'
    else bucket = '90+'

    return {
      advanceNo: a.advanceNo,
      employeeName: empNameMap[a.employeeId] || 'Unknown',
      purpose: a.purpose,
      advanceType: a.advanceType,
      disbursedAmount: disbursed,
      settledAmount: settled,
      outstanding,
      disbursedAt: a.disbursedAt,
      expectedSettlementDate: a.expectedSettlementDate,
      daysAge,
      bucket,
      status: a.status,
    }
  })

  // Bucket summaries
  const buckets = ['0-30', '31-60', '61-90', '90+']
  const bucketSummary = buckets.map(b => ({
    bucket: b,
    count: entries.filter(e => e.bucket === b).length,
    totalOutstanding: entries.filter(e => e.bucket === b).reduce((s, e) => s + e.outstanding, 0),
  }))

  const totalOutstanding = entries.reduce((s, e) => s + e.outstanding, 0)

  return {
    reportType: 'advance-aging',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    entries,
    bucketSummary,
    summary: {
      totalAdvances: entries.length,
      totalDisbursed: entries.reduce((s, e) => s + e.disbursedAmount, 0),
      totalSettled: entries.reduce((s, e) => s + e.settledAmount, 0),
      totalOutstanding,
    },
  }
}

// ─── Petty Cash Statement ───

async function generatePettyCashStatement(filters: ReportFilters, _auth: AccessTokenPayload) {
  const funds = await prisma.pettyCashFund.findMany({
    where: {
      organizationId: filters.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      location: true,
      imprestAmount: true,
      currentBalance: true,
      transactions: {
        where: {
          date: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        },
        select: {
          id: true,
          transactionNo: true,
          date: true,
          action: true,
          amount: true,
          balanceAfter: true,
          description: true,
          category: true,
        },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const fundStatements = funds.map(f => {
    const transactions = f.transactions.map(tx => ({
      transactionNo: tx.transactionNo,
      date: tx.date,
      action: tx.action,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balanceAfter),
      description: tx.description,
      category: tx.category,
    }))

    const totalExpenses = transactions.filter(t => t.action === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    const totalReplenishments = transactions.filter(t => t.action === 'REPLENISHMENT').reduce((s, t) => s + t.amount, 0)
    const openingBalance = transactions.length > 0
      ? (transactions[0].action === 'EXPENSE'
        ? transactions[0].balanceAfter + transactions[0].amount
        : transactions[0].balanceAfter - transactions[0].amount)
      : Number(f.currentBalance)
    const closingBalance = transactions.length > 0
      ? transactions[transactions.length - 1].balanceAfter
      : Number(f.currentBalance)

    return {
      fundId: f.id,
      fundName: f.name,
      fundCode: f.code,
      location: f.location,
      imprestAmount: Number(f.imprestAmount),
      openingBalance,
      closingBalance,
      totalExpenses,
      totalReplenishments,
      transactionCount: transactions.length,
      transactions,
    }
  })

  return {
    reportType: 'petty-cash-statement',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    funds: fundStatements,
    summary: {
      totalFunds: fundStatements.length,
      totalExpenses: fundStatements.reduce((s, f) => s + f.totalExpenses, 0),
      totalReplenishments: fundStatements.reduce((s, f) => s + f.totalReplenishments, 0),
      totalClosingBalance: fundStatements.reduce((s, f) => s + f.closingBalance, 0),
    },
  }
}

// ─── Per Diem Utilization ───

async function generatePerDiemUtilization(filters: ReportFilters, _auth: AccessTokenPayload) {
  // Get expense claims with per-diem / travel items
  const claims = await prisma.expenseClaim.findMany({
    where: {
      organizationId: filters.organizationId,
      status: { in: ['FINANCE_APPROVED', 'PAID'] },
      claimDate: {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      },
      items: {
        some: {
          category: { in: ['per_diem', 'travel', 'Per Diem', 'Travel', 'PER_DIEM', 'TRAVEL'] },
        },
      },
    },
    select: {
      id: true,
      claimNo: true,
      employeeId: true,
      claimDate: true,
      travelStartDate: true,
      travelEndDate: true,
      projectId: true,
      items: {
        where: {
          category: { in: ['per_diem', 'travel', 'Per Diem', 'Travel', 'PER_DIEM', 'TRAVEL'] },
        },
        select: {
          amount: true,
          approvedAmount: true,
          location: true,
          category: true,
        },
      },
    },
  })

  // Resolve employee names
  const employeeIds = [...new Set(claims.map(c => c.employeeId))]
  const employees = employeeIds.length > 0
    ? await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, fullName: true } })
    : []
  const empNameMap: Record<string, string> = Object.fromEntries(employees.map(e => [e.id, e.fullName]))

  // Get per diem rates for comparison
  const rates = await prisma.perDiemRate.findMany({
    where: { organizationId: filters.organizationId, isActive: true },
    select: { location: true, fullDayRate: true },
  })
  const rateMap: Record<string, number> = Object.fromEntries(rates.map(r => [r.location.toLowerCase(), Number(r.fullDayRate)]))

  const entries = claims.map(c => {
    const claimedAmount = c.items.reduce((s, i) => s + Number(i.amount), 0)
    const approvedAmount = c.items.reduce((s, i) => s + Number(i.approvedAmount ?? i.amount), 0)
    const location = c.items[0]?.location || 'Unknown'

    // Calculate entitled amount from rates and travel days
    let entitledAmount = 0
    if (c.travelStartDate && c.travelEndDate) {
      const msPerDay = 24 * 60 * 60 * 1000
      const days = Math.round((new Date(c.travelEndDate).getTime() - new Date(c.travelStartDate).getTime()) / msPerDay) + 1
      const ratePerDay = rateMap[location.toLowerCase()] || 0
      entitledAmount = days * ratePerDay
    }

    return {
      claimNo: c.claimNo,
      employeeName: empNameMap[c.employeeId] || 'Unknown',
      claimDate: c.claimDate,
      travelStartDate: c.travelStartDate,
      travelEndDate: c.travelEndDate,
      location,
      claimedAmount,
      approvedAmount,
      entitledAmount,
      variance: claimedAmount - entitledAmount,
    }
  })

  return {
    reportType: 'per-diem-utilization',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    entries,
    summary: {
      totalClaims: entries.length,
      totalClaimed: entries.reduce((s, e) => s + e.claimedAmount, 0),
      totalApproved: entries.reduce((s, e) => s + e.approvedAmount, 0),
      totalEntitled: entries.reduce((s, e) => s + e.entitledAmount, 0),
      totalVariance: entries.reduce((s, e) => s + e.variance, 0),
    },
  }
}

// ─── Receipt Compliance ───

async function generateReceiptCompliance(filters: ReportFilters, _auth: AccessTokenPayload) {
  const claims = await prisma.expenseClaim.findMany({
    where: {
      organizationId: filters.organizationId,
      status: { in: ['FINANCE_APPROVED', 'PAID'] },
      claimDate: {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      },
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
    },
    select: {
      id: true,
      claimNo: true,
      employeeId: true,
      claimDate: true,
      items: {
        select: {
          category: true,
          amount: true,
          hasReceipt: true,
          noReceiptReason: true,
        },
      },
    },
  })

  // Resolve employee names
  const employeeIds = [...new Set(claims.map(c => c.employeeId))]
  const employees = employeeIds.length > 0
    ? await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, fullName: true } })
    : []
  const empNameMap: Record<string, string> = Object.fromEntries(employees.map(e => [e.id, e.fullName]))

  const entries = claims.map(c => {
    const totalItems = c.items.length
    const withReceipt = c.items.filter(i => i.hasReceipt).length
    const withoutReceipt = totalItems - withReceipt
    const totalAmount = c.items.reduce((s, i) => s + Number(i.amount), 0)
    const receiptAmount = c.items.filter(i => i.hasReceipt).reduce((s, i) => s + Number(i.amount), 0)
    const complianceRate = totalItems > 0 ? (withReceipt / totalItems) * 100 : 100

    return {
      claimNo: c.claimNo,
      employeeName: empNameMap[c.employeeId] || 'Unknown',
      claimDate: c.claimDate,
      totalItems,
      withReceipt,
      withoutReceipt,
      totalAmount,
      receiptAmount,
      nonReceiptAmount: totalAmount - receiptAmount,
      complianceRate: Math.round(complianceRate * 10) / 10,
      missingReasons: c.items.filter(i => !i.hasReceipt && i.noReceiptReason).map(i => ({
        category: i.category,
        amount: Number(i.amount),
        reason: i.noReceiptReason,
      })),
    }
  })

  const totalItems = entries.reduce((s, e) => s + e.totalItems, 0)
  const totalWithReceipt = entries.reduce((s, e) => s + e.withReceipt, 0)

  return {
    reportType: 'receipt-compliance',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    entries,
    summary: {
      totalClaims: entries.length,
      totalItems,
      totalWithReceipt,
      totalWithoutReceipt: totalItems - totalWithReceipt,
      overallComplianceRate: totalItems > 0 ? Math.round((totalWithReceipt / totalItems) * 1000) / 10 : 100,
      totalAmount: entries.reduce((s, e) => s + e.totalAmount, 0),
      receiptAmount: entries.reduce((s, e) => s + e.receiptAmount, 0),
    },
  }
}

// ─── TDS/VDS Register ───

async function generateTdsVdsRegister(filters: ReportFilters, _auth: AccessTokenPayload) {
  const claims = await prisma.expenseClaim.findMany({
    where: {
      organizationId: filters.organizationId,
      status: { in: ['FINANCE_APPROVED', 'PAID'] },
      claimDate: {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      },
      items: {
        some: {
          OR: [
            { tdsAmount: { gt: 0 } },
            { vdsAmount: { gt: 0 } },
          ],
        },
      },
    },
    select: {
      id: true,
      claimNo: true,
      employeeId: true,
      claimDate: true,
      items: {
        where: {
          OR: [
            { tdsAmount: { gt: 0 } },
            { vdsAmount: { gt: 0 } },
          ],
        },
        select: {
          category: true,
          description: true,
          amount: true,
          tdsRate: true,
          tdsAmount: true,
          vdsRate: true,
          vdsAmount: true,
        },
      },
    },
    orderBy: { claimDate: 'asc' },
  })

  // Resolve employee names
  const employeeIds = [...new Set(claims.map(c => c.employeeId))]
  const employees = employeeIds.length > 0
    ? await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, fullName: true } })
    : []
  const empNameMap: Record<string, string> = Object.fromEntries(employees.map(e => [e.id, e.fullName]))

  // Flatten and group by month
  const entries: {
    claimNo: string; employeeName: string; date: Date; category: string; description: string;
    amount: number; tdsRate: number; tdsAmount: number; vdsRate: number; vdsAmount: number; month: string;
  }[] = []

  for (const claim of claims) {
    for (const item of claim.items) {
      const monthKey = `${claim.claimDate.getFullYear()}-${String(claim.claimDate.getMonth() + 1).padStart(2, '0')}`
      entries.push({
        claimNo: claim.claimNo,
        employeeName: empNameMap[claim.employeeId] || 'Unknown',
        date: claim.claimDate,
        category: item.category,
        description: item.description,
        amount: Number(item.amount),
        tdsRate: Number(item.tdsRate ?? 0),
        tdsAmount: Number(item.tdsAmount ?? 0),
        vdsRate: Number(item.vdsRate ?? 0),
        vdsAmount: Number(item.vdsAmount ?? 0),
        month: monthKey,
      })
    }
  }

  // Monthly summary
  const monthMap: Record<string, { tds: number; vds: number; baseAmount: number; count: number }> = {}
  for (const e of entries) {
    if (!monthMap[e.month]) monthMap[e.month] = { tds: 0, vds: 0, baseAmount: 0, count: 0 }
    monthMap[e.month].tds += e.tdsAmount
    monthMap[e.month].vds += e.vdsAmount
    monthMap[e.month].baseAmount += e.amount
    monthMap[e.month].count += 1
  }

  const monthlySummary = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data, total: data.tds + data.vds }))

  return {
    reportType: 'tds-vds-register',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    entries,
    monthlySummary,
    summary: {
      totalEntries: entries.length,
      totalBaseAmount: entries.reduce((s, e) => s + e.amount, 0),
      totalTds: entries.reduce((s, e) => s + e.tdsAmount, 0),
      totalVds: entries.reduce((s, e) => s + e.vdsAmount, 0),
      grandTotal: entries.reduce((s, e) => s + e.tdsAmount + e.vdsAmount, 0),
    },
  }
}

// ─── Donor Expense Report ───

async function generateDonorExpenseReport(filters: ReportFilters, _auth: AccessTokenPayload, url: URL) {
  const grantId = url.searchParams.get('grantId')

  const grantWhere: Record<string, unknown> = { donor: { organizationId: filters.organizationId } }
  if (grantId) grantWhere.id = grantId

  const grants = await prisma.grant.findMany({
    where: grantWhere,
    select: {
      id: true,
      title: true,
      grantNo: true,
      awardAmount: true,
      disbursedAmount: true,
      donor: { select: { name: true } },
      budgets: {
        select: {
          id: true,
          name: true,
          totalAmount: true,
        },
      },
    },
  })

  // For each grant, get expense JE lines
  const grantReports = await Promise.all(grants.map(async (grant) => {
    const journalLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
          fiscalYearId: filters.fiscalYearId,
          grantId: grant.id,
          ...(filters.startDate && filters.endDate ? { date: { gte: filters.startDate, lte: filters.endDate } } : {}),
        },
        account: { type: 'EXPENSE' },
      },
      select: {
        debit: true,
        credit: true,
        account: { select: { code: true, name: true } },
        journalEntry: { select: { date: true, description: true } },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    })

    // Group by account
    const accountMap: Record<string, { accountCode: string; accountName: string; totalAmount: number }> = {}
    for (const line of journalLines) {
      const key = line.account.code
      if (!accountMap[key]) {
        accountMap[key] = { accountCode: line.account.code, accountName: line.account.name, totalAmount: 0 }
      }
      accountMap[key].totalAmount += Number(line.debit) - Number(line.credit)
    }

    const expenseLines = Object.values(accountMap).sort((a, b) => a.accountCode.localeCompare(b.accountCode))
    const totalExpenses = expenseLines.reduce((s, l) => s + l.totalAmount, 0)
    const totalBudget = grant.budgets.reduce((s, b) => s + Number(b.totalAmount), 0)

    return {
      grantId: grant.id,
      grantNo: grant.grantNo,
      grantTitle: grant.title,
      donorName: grant.donor.name,
      awardAmount: Number(grant.awardAmount),
      disbursedAmount: Number(grant.disbursedAmount),
      totalBudget,
      totalExpenses,
      remainingBudget: totalBudget - totalExpenses,
      utilizationRate: totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 1000) / 10 : 0,
      expenseLines,
    }
  }))

  // Filter out grants with no expenses unless specifically queried
  const activeReports = grantId ? grantReports : grantReports.filter(g => g.totalExpenses > 0)

  return {
    reportType: 'donor-expense-report',
    fiscalYearId: filters.fiscalYearId,
    periodStart: filters.startDate,
    periodEnd: filters.endDate,
    generatedAt: new Date(),
    grants: activeReports,
    summary: {
      totalGrants: activeReports.length,
      totalAward: activeReports.reduce((s, g) => s + g.awardAmount, 0),
      totalBudget: activeReports.reduce((s, g) => s + g.totalBudget, 0),
      totalExpenses: activeReports.reduce((s, g) => s + g.totalExpenses, 0),
      totalRemaining: activeReports.reduce((s, g) => s + g.remainingBudget, 0),
    },
  }
}
