'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, Activity,
  Loader2, AlertCircle, Clock, Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useFormatters } from '@/hooks/use-formatters'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Types ───

interface BudgetItem {
  id: string
  name: string
  budgetCode: string
  status: string
  totalAmount: number
  startDate: string | null
  endDate: string | null
  utilizationPercent: number
  project: { id: string; name: string } | null
  lines?: { category: string; totalAmount: number }[]
  _count?: { lines: number }
}

interface VsActualData {
  budgetId: string
  budgetName: string
  totals: {
    totalBudget: number
    totalActual: number
    totalVariance: number
    overallUtilizationPercent: number
  }
  lines: {
    category: string
    budgetAmount: number
    actualSpent: number
  }[]
}

interface BurnRateInfo {
  monthlyBurnRate: number
  projectedBurnRate: number
  monthsElapsed: number
  monthsRemaining: number
  runwayMonths: number
  exhaustionDate: string | null
  totalActual: number
  totalBudget: number
  remaining: number
}

// ─── Constants ───

const STATUS_LIST = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CLOSED'] as const

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

// ─── Helpers ───

function monthsBetween(start: Date, end: Date): number {
  const diff = (end.getFullYear() - start.getFullYear()) * 12
    + (end.getMonth() - start.getMonth())
  return Math.max(diff, 1)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'CLOSED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getBurnRateColor(rate: number, budget: number, months: number): string {
  if (months <= 0) return 'text-muted-foreground'
  const expectedRate = budget / months
  if (rate > expectedRate * 1.2) return 'text-red-600 dark:text-red-400'
  if (rate > expectedRate * 0.9) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

// ─── Main Page ───

export default function BudgetAnalyticsPage() {
  const t = useTranslations('budget.analytics')
  const tc = useTranslations('common')
  const { formatCurrency, formatPercent, formatNumber } = useFormatters()

  // State
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [budgetsError, setBudgetsError] = useState('')

  const [vsActualMap, setVsActualMap] = useState<Record<string, VsActualData>>({})
  const [vsActualLoading, setVsActualLoading] = useState(false)

  const [selectedBudgetId, setSelectedBudgetId] = useState('')

  // ─── Fetch budgets ───

  const fetchBudgets = useCallback(async () => {
    setBudgetsLoading(true)
    setBudgetsError('')
    try {
      const res = await fetch('/api/v1/budget?limit=200')
      const json = await res.json()
      if (json.success) {
        setBudgets(json.data ?? [])
      } else {
        setBudgetsError(json.error?.message || t('errorLoadingBudgets'))
      }
    } catch {
      setBudgetsError(t('errorLoadingBudgets'))
    }
    setBudgetsLoading(false)
  }, [t])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  // ─── Fetch vs-actual for active/approved budgets ───

  const activeBudgets = useMemo(
    () => budgets.filter(b => b.status === 'ACTIVE' || b.status === 'APPROVED'),
    [budgets]
  )

  useEffect(() => {
    if (activeBudgets.length === 0) return

    let cancelled = false
    setVsActualLoading(true)

    async function fetchAll() {
      const results: Record<string, VsActualData> = {}

      await Promise.allSettled(
        activeBudgets.map(async (budget) => {
          try {
            const res = await fetch(`/api/v1/budget/${budget.id}/vs-actual`)
            const json = await res.json()
            if (json.success) {
              results[budget.id] = json.data
            }
          } catch {
            // Silently skip failed requests — show partial data
          }
        })
      )

      if (!cancelled) {
        setVsActualMap(results)
        setVsActualLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [activeBudgets])

  // ─── KPI Computations ───

  const kpis = useMemo(() => {
    const activeApproved = budgets.filter(b => b.status === 'ACTIVE' || b.status === 'APPROVED')
    const totalBudgetAmount = activeApproved.reduce((sum, b) => sum + Number(b.totalAmount), 0)

    let totalUtilized = 0
    for (const b of activeApproved) {
      const vsData = vsActualMap[b.id]
      if (vsData) {
        totalUtilized += vsData.totals.totalActual
      }
    }

    const avgUtilization = totalBudgetAmount > 0
      ? Math.round((totalUtilized / totalBudgetAmount) * 10000) / 100
      : 0

    return {
      activeBudgetCount: activeApproved.length,
      totalBudgetAmount,
      totalUtilized,
      avgUtilization,
    }
  }, [budgets, vsActualMap])

  // ─── Burn Rate for selected budget ───

  const burnRate = useMemo((): BurnRateInfo | null => {
    if (!selectedBudgetId) return null
    const budget = budgets.find(b => b.id === selectedBudgetId)
    if (!budget) return null

    const vsData = vsActualMap[budget.id]
    const totalBudget = Number(budget.totalAmount)
    const totalActual = vsData ? vsData.totals.totalActual : 0
    const remaining = totalBudget - totalActual

    const now = new Date()
    const start = budget.startDate ? new Date(budget.startDate) : now
    const end = budget.endDate ? new Date(budget.endDate) : new Date(now.getFullYear(), now.getMonth() + 12, now.getDate())

    const totalMonths = monthsBetween(start, end)
    const monthsElapsed = Math.max(monthsBetween(start, now), 1)
    const monthsRemaining = Math.max(totalMonths - monthsElapsed, 0)

    const monthlyBurnRate = totalActual / monthsElapsed
    const projectedBurnRate = monthsRemaining > 0 ? remaining / monthsRemaining : 0

    let runwayMonths = 0
    let exhaustionDate: string | null = null
    if (monthlyBurnRate > 0) {
      runwayMonths = Math.round((remaining / monthlyBurnRate) * 10) / 10
      const exhaustion = new Date(now)
      exhaustion.setMonth(exhaustion.getMonth() + Math.ceil(runwayMonths))
      exhaustionDate = exhaustion.toISOString()
    }

    return {
      monthlyBurnRate,
      projectedBurnRate,
      monthsElapsed,
      monthsRemaining,
      runwayMonths,
      exhaustionDate,
      totalActual,
      totalBudget,
      remaining,
    }
  }, [selectedBudgetId, budgets, vsActualMap])

  // ─── Chart: Utilization by Project ───

  const utilizationChartData = useMemo(() => {
    return budgets
      .filter(b => b.status === 'ACTIVE' || b.status === 'APPROVED')
      .map(b => ({
        name: b.name.length > 25 ? b.name.slice(0, 22) + '...' : b.name,
        utilization: b.utilizationPercent ?? 0,
      }))
      .sort((a, b) => b.utilization - a.utilization)
  }, [budgets])

  // ─── Chart: Budget Allocation by Category ───

  const categoryChartData = useMemo(() => {
    const catMap: Record<string, number> = {}

    for (const budget of activeBudgets) {
      const vsData = vsActualMap[budget.id]
      if (vsData) {
        for (const line of vsData.lines) {
          const cat = line.category || 'Other'
          catMap[cat] = (catMap[cat] || 0) + line.budgetAmount
        }
      }
    }

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [activeBudgets, vsActualMap])

  // ─── Chart: Monthly Spend Trend ───

  const monthlySpendData = useMemo(() => {
    // Build a cumulative monthly trend from all vs-actual data
    // Since we don't have monthly granularity from the API, we simulate
    // by distributing actual spend evenly across elapsed months for each budget
    const monthMap: Record<string, number> = {}
    const now = new Date()

    for (const budget of activeBudgets) {
      const vsData = vsActualMap[budget.id]
      if (!vsData) continue

      const start = budget.startDate ? new Date(budget.startDate) : new Date(now.getFullYear(), 0, 1)
      const months = Math.max(monthsBetween(start, now), 1)
      const monthlySpend = vsData.totals.totalActual / months

      for (let i = 0; i < months; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthMap[key] = (monthMap[key] || 0) + monthlySpend
      }
    }

    const sorted = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b))
    let cumulative = 0
    return sorted.map(([month, spend]) => {
      cumulative += spend
      return { month, spend: Math.round(spend), cumulative: Math.round(cumulative) }
    })
  }, [activeBudgets, vsActualMap])

  // ─── Status Distribution ───

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of STATUS_LIST) counts[s] = 0
    for (const b of budgets) {
      if (counts[b.status] !== undefined) counts[b.status]++
      else counts[b.status] = 1
    }
    return counts
  }, [budgets])

  // ─── Budget select options ───

  const budgetOptions = useMemo(() =>
    activeBudgets.map(b => ({
      value: b.id,
      label: `${b.budgetCode} — ${b.name}`,
      description: b.project?.name,
    })),
    [activeBudgets]
  )

  // ─── Loading / Error States ───

  if (budgetsLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title={t('title')} description={t('description')} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (budgetsError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title={t('title')} description={t('description')} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive font-medium">{budgetsError}</p>
            <button
              onClick={fetchBudgets}
              className="mt-4 text-sm text-primary underline hover:no-underline"
            >
              {t('retry')}
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />

      {/* ─── Section 1: Portfolio Overview KPIs ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalActiveBudgets')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeBudgetCount}</div>
            <p className="text-xs text-muted-foreground">{t('activeApprovedBudgets')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalBudgetAmount')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.totalBudgetAmount)}</div>
            <p className="text-xs text-muted-foreground">{t('acrossAllBudgets')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUtilized')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vsActualLoading
                ? <Loader2 className="h-5 w-5 animate-spin inline" />
                : formatCurrency(kpis.totalUtilized)
              }
            </div>
            <p className="text-xs text-muted-foreground">{t('totalActualSpend')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgUtilization')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vsActualLoading
                ? <Loader2 className="h-5 w-5 animate-spin inline" />
                : formatPercent(kpis.avgUtilization)
              }
            </div>
            <p className="text-xs text-muted-foreground">{t('weightedAverage')}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Section 2: Burn Rate Analysis ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            {t('burnRateAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <SearchableSelect
              options={budgetOptions}
              value={selectedBudgetId}
              onValueChange={setSelectedBudgetId}
              placeholder={t('selectBudget')}
              searchPlaceholder={t('searchBudgets')}
              emptyMessage={t('noBudgets')}
            />
          </div>

          {!selectedBudgetId && (
            <p className="text-sm text-muted-foreground py-4">{t('selectBudgetPrompt')}</p>
          )}

          {selectedBudgetId && !burnRate && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">{t('loading')}</span>
            </div>
          )}

          {burnRate && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('monthlyBurnRate')}</p>
                  <p className={`text-xl font-bold mt-1 ${getBurnRateColor(burnRate.monthlyBurnRate, burnRate.totalBudget, burnRate.monthsElapsed + burnRate.monthsRemaining)}`}>
                    {formatCurrency(burnRate.monthlyBurnRate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('monthsElapsed', { count: burnRate.monthsElapsed })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('projectedBurnRate')}</p>
                  <p className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
                    {burnRate.monthsRemaining > 0
                      ? formatCurrency(burnRate.projectedBurnRate)
                      : t('budgetPeriodEnded')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('monthsRemaining', { count: burnRate.monthsRemaining })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('remainingBudget')}</p>
                  <p className={`text-xl font-bold mt-1 ${burnRate.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                    {formatCurrency(burnRate.remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercent(burnRate.totalBudget > 0 ? ((burnRate.remaining / burnRate.totalBudget) * 100) : 0)} {t('ofTotal')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('runway')}</p>
                  <p className="text-xl font-bold mt-1">
                    {burnRate.runwayMonths > 0
                      ? t('runwayMonths', { count: burnRate.runwayMonths })
                      : t('noRunway')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {burnRate.exhaustionDate
                      ? t('exhaustsBy', { date: new Date(burnRate.exhaustionDate).toLocaleDateString() })
                      : t('noSpendYet')
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 3: Charts ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Utilization by Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('utilizationByProject')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {utilizationChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('noDataAvailable')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(utilizationChartData.length * 40, 200)}>
                <BarChart data={utilizationChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value}%`, t('utilization')]} />
                  <Bar dataKey="utilization" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Budget Allocation by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              {t('allocationByCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vsActualLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('noDataAvailable')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), t('amount')]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spend Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('monthlySpendTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vsActualLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : monthlySpendData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('noDataAvailable')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpendData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'cumulative' ? t('cumulativeSpend') : t('monthlySpend'),
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name={t('cumulativeSpend')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  name={t('monthlySpend')}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ─── Section 4: Budget Status Distribution ─── */}
      <Card>
        <CardHeader>
          <CardTitle>{t('statusDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {STATUS_LIST.map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg border px-4 py-3"
              >
                <Badge className={getStatusColor(status)} variant="secondary">
                  {status}
                </Badge>
                <span className="text-2xl font-bold">{statusDistribution[status] || 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
