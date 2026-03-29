'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Download, TrendingUp, TrendingDown, Target, BarChart3, Loader2, AlertCircle, FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useFormatters } from '@/hooks/use-formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ─── Types ───

interface BudgetOption {
  id: string
  name: string
  budgetCode: string
  status: string
  project: { id: string; name: string } | null
  totalAmount: number
}

interface LineAnalysis {
  id: string
  accountId: string
  account: { id: string; code: string; name: string }
  category: string
  description: string
  budgetAmount: number
  actualSpent: number
  variance: number
  variancePercent: number
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET'
}

interface VsActualData {
  budgetId: string
  budgetName: string
  project: { id: string; name: string } | null
  currencyCode: string
  lines: LineAnalysis[]
  totals: {
    totalBudget: number
    totalActual: number
    totalVariance: number
    overallUtilizationPercent: number
  }
}

// ─── Helpers ───

function getUtilizationColor(percent: number): string {
  if (percent > 95) return 'bg-red-100 dark:bg-red-950/40'
  if (percent >= 80) return 'bg-yellow-50 dark:bg-yellow-950/30'
  return ''
}

function getUtilizationTextColor(percent: number): string {
  if (percent > 95) return 'text-red-600 dark:text-red-400'
  if (percent >= 80) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED': return 'default'
    case 'DRAFT': return 'secondary'
    case 'REJECTED': return 'destructive'
    default: return 'outline'
  }
}

// ─── Main Page ───

export default function BudgetVsActualPage() {
  const t = useTranslations('budget.vsActual')
  const tc = useTranslations('common')
  const { formatCurrency, formatPercent } = useFormatters()

  // State
  const [budgets, setBudgets] = useState<BudgetOption[]>([])
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [budgetsError, setBudgetsError] = useState('')

  const [selectedBudgetId, setSelectedBudgetId] = useState('')
  const [vsActualData, setVsActualData] = useState<VsActualData | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState('')

  // ─── Fetch budgets on mount ───

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

  // ─── Fetch vs-actual when budget selected ───

  const fetchAnalysis = useCallback(async (budgetId: string) => {
    if (!budgetId) return
    setAnalysisLoading(true)
    setAnalysisError('')
    setVsActualData(null)
    try {
      const res = await fetch(`/api/v1/budget/${budgetId}/vs-actual`)
      const json = await res.json()
      if (json.success) {
        setVsActualData(json.data)
      } else {
        setAnalysisError(json.error?.message || t('errorLoadingAnalysis'))
      }
    } catch {
      setAnalysisError(t('errorLoadingAnalysis'))
    }
    setAnalysisLoading(false)
  }, [t])

  function handleBudgetChange(id: string) {
    setSelectedBudgetId(id)
    if (id) fetchAnalysis(id)
    else setVsActualData(null)
  }

  // ─── Derived data ───

  const budgetOptions = useMemo(
    () => budgets.map(b => ({
      value: b.id,
      label: `${b.budgetCode} - ${b.name}`,
    })),
    [budgets],
  )

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId)

  const categories = useMemo(() => {
    if (!vsActualData) return []
    return [...new Set(vsActualData.lines.map(l => l.category))]
  }, [vsActualData])

  const chartData = useMemo(() => {
    if (!vsActualData) return []
    return categories.map(cat => {
      const catLines = vsActualData.lines.filter(l => l.category === cat)
      return {
        category: cat,
        budgeted: catLines.reduce((s, l) => s + l.budgetAmount, 0),
        actual: catLines.reduce((s, l) => s + l.actualSpent, 0),
      }
    })
  }, [vsActualData, categories])

  // ─── Export CSV ───

  function exportCsv() {
    if (!vsActualData) return
    const headers = [
      t('category'), t('account'), t('budgetAmount'), t('actualSpent'), t('variance'), t('utilization'),
    ]
    const rows = vsActualData.lines.map(l => [
      l.category,
      `${l.account.code} - ${l.account.name}`,
      l.budgetAmount,
      l.actualSpent,
      l.variance,
      `${l.variancePercent}%`,
    ])
    // Add totals row
    rows.push([
      t('grandTotal'), '',
      vsActualData.totals.totalBudget,
      vsActualData.totals.totalActual,
      vsActualData.totals.totalVariance,
      `${vsActualData.totals.overallUtilizationPercent}%`,
    ])
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-vs-actual-${vsActualData.budgetName.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ───

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        {vsActualData && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            {t('exportCsv')}
          </Button>
        )}
      </PageHeader>

      {/* Budget selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md">
            {budgetsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loadingBudgets')}
              </div>
            ) : budgetsError ? (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {budgetsError}
                <Button variant="ghost" size="sm" onClick={fetchBudgets}>
                  {t('retry')}
                </Button>
              </div>
            ) : (
              <SearchableSelect
                options={budgetOptions}
                value={selectedBudgetId}
                onValueChange={handleBudgetChange}
                placeholder={t('selectBudget')}
                searchPlaceholder={t('searchBudgets')}
                emptyMessage={t('noBudgets')}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {analysisLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          {t('loadingAnalysis')}
        </div>
      )}

      {/* Error state */}
      {analysisError && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p>{analysisError}</p>
              <Button variant="outline" size="sm" onClick={() => fetchAnalysis(selectedBudgetId)}>
                {t('retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state - no budget selected */}
      {!selectedBudgetId && !budgetsLoading && !budgetsError && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12" />
              <p className="text-sm">{t('selectBudgetPrompt')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data display */}
      {vsActualData && !analysisLoading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('totalBudget')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {formatCurrency(vsActualData.totals.totalBudget)}
                  </p>
                </div>
                {selectedBudget && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vsActualData.project && (
                      <Badge variant="outline" className="text-xs">
                        {vsActualData.project.name}
                      </Badge>
                    )}
                    <Badge variant={getStatusBadgeVariant(selectedBudget.status)} className="text-xs">
                      {selectedBudget.status}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('totalActual')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(vsActualData.totals.totalActual)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('totalVariance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {vsActualData.totals.totalVariance >= 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  )}
                  <p className={`text-2xl font-bold ${
                    vsActualData.totals.totalVariance >= 0 ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {vsActualData.totals.totalVariance >= 0 ? '' : '-'}
                    {formatCurrency(Math.abs(vsActualData.totals.totalVariance))}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('overallUtilization')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className={`text-2xl font-bold ${getUtilizationTextColor(vsActualData.totals.overallUtilizationPercent)}`}>
                    {formatPercent(vsActualData.totals.overallUtilizationPercent)}
                  </p>
                </div>
                <Progress
                  value={Math.min(vsActualData.totals.overallUtilizationPercent, 100)}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('chartTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="category"
                        angle={-25}
                        textAnchor="end"
                        tick={{ fontSize: 12 }}
                        height={60}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="budgeted" name={t('budgeted')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name={t('actual')} fill="hsl(var(--chart-2, 220 70% 50%))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('comparison')}</CardTitle>
            </CardHeader>
            <CardContent>
              {vsActualData.lines.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-8 w-8" />
                  <p className="text-sm">{t('noLineItems')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('category')}</TableHead>
                      <TableHead>{t('account')}</TableHead>
                      <TableHead className="text-right">{t('budgetAmount')}</TableHead>
                      <TableHead className="text-right">{t('actualSpent')}</TableHead>
                      <TableHead className="text-right">{t('variance')}</TableHead>
                      <TableHead className="text-right w-25">{t('utilization')}</TableHead>
                      <TableHead className="w-35">{t('progress')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => {
                      const catLines = vsActualData.lines.filter(l => l.category === category)
                      const catBudget = catLines.reduce((s, l) => s + l.budgetAmount, 0)
                      const catActual = catLines.reduce((s, l) => s + l.actualSpent, 0)
                      const catVariance = catBudget - catActual
                      const catUtilization = catBudget > 0 ? (catActual / catBudget) * 100 : 0

                      return [
                        /* Category header row */
                        <TableRow key={`cat-${category}`} className="bg-muted/50">
                          <TableCell colSpan={7} className="font-semibold text-sm">
                            {category}
                          </TableCell>
                        </TableRow>,

                        /* Line items */
                        ...catLines.map(line => {
                          const utilization = line.budgetAmount > 0
                            ? (line.actualSpent / line.budgetAmount) * 100
                            : 0

                          return (
                            <TableRow key={line.id} className={getUtilizationColor(utilization)}>
                              <TableCell className="text-sm pl-8">{line.category}</TableCell>
                              <TableCell className="text-sm">
                                <span className="font-mono text-xs text-muted-foreground">{line.account.code}</span>
                                {' '}
                                {line.account.name}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(line.budgetAmount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(line.actualSpent)}
                              </TableCell>
                              <TableCell className={`text-right font-mono text-sm ${
                                line.variance >= 0 ? 'text-green-600' : 'text-destructive'
                              }`}>
                                {line.variance >= 0 ? '' : '-'}{formatCurrency(Math.abs(line.variance))}
                              </TableCell>
                              <TableCell className={`text-right font-mono text-sm font-medium ${getUtilizationTextColor(utilization)}`}>
                                {formatPercent(utilization)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={Math.min(utilization, 100)}
                                    className="flex-1"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        }),

                        /* Category subtotal */
                        <TableRow key={`subtotal-${category}`} className="border-b-2">
                          <TableCell className="text-sm font-medium pl-8 italic" colSpan={2}>
                            {t('subtotal', { category })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {formatCurrency(catBudget)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {formatCurrency(catActual)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm font-medium ${
                            catVariance >= 0 ? 'text-green-600' : 'text-destructive'
                          }`}>
                            {catVariance >= 0 ? '' : '-'}{formatCurrency(Math.abs(catVariance))}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm font-medium ${getUtilizationTextColor(catUtilization)}`}>
                            {formatPercent(catUtilization)}
                          </TableCell>
                          <TableCell />
                        </TableRow>,
                      ]
                    })}

                    {/* Grand total row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="font-semibold" colSpan={2}>{t('grandTotal')}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(vsActualData.totals.totalBudget)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(vsActualData.totals.totalActual)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${
                        vsActualData.totals.totalVariance >= 0 ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {vsActualData.totals.totalVariance >= 0 ? '' : '-'}
                        {formatCurrency(Math.abs(vsActualData.totals.totalVariance))}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${
                        getUtilizationTextColor(vsActualData.totals.overallUtilizationPercent)
                      }`}>
                        {formatPercent(vsActualData.totals.overallUtilizationPercent)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
