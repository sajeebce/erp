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
