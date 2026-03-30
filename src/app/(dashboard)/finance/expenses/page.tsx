'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Loader2,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Plus,
  ArrowRight,
  Receipt,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface PettyCashFund {
  id: string
  name: string
  currentBalance: number
  imprestAmount: number
}

interface ExpenseClaim {
  id: string
  claimNumber: string
  employeeName: string
  amount: number
  status: string
  description: string
  submittedAt: string
  category: string
}

interface OutstandingAdvance {
  id: string
  employeeName: string
  amount: number
  purpose: string
  issuedAt: string
}

// ─── Status Badge Colors ───

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED': return 'default'
    case 'SUBMITTED':
    case 'PENDING': return 'secondary'
    case 'REJECTED': return 'destructive'
    default: return 'outline'
  }
}

// ─── Main Page ───

export default function ExpenseDashboardPage() {
  const t = useTranslations('finance.expenses')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pettyCashFunds, setPettyCashFunds] = useState<PettyCashFund[]>([])
  const [pendingClaims, setPendingClaims] = useState<ExpenseClaim[]>([])
  const [recentClaims, setRecentClaims] = useState<ExpenseClaim[]>([])
  const [outstandingAdvances, setOutstandingAdvances] = useState<OutstandingAdvance[]>([])

  // ─── Derived KPIs ───

  const totalPettyCash = pettyCashFunds.reduce((sum, f) => sum + f.currentBalance, 0)
  const pendingClaimsCount = pendingClaims.length
  const totalOutstandingAdvances = outstandingAdvances.reduce((sum, a) => sum + a.amount, 0)
  const claimsThisMonth = recentClaims.filter((c) => {
    const d = new Date(c.submittedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // ─── Data Fetching ───

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pcRes, claimsRes, advRes] = await Promise.all([
        fetch('/api/v1/finance/petty-cash'),
        fetch('/api/v1/finance/expense-claims?status=SUBMITTED&limit=5'),
        fetch('/api/v1/finance/advances/outstanding'),
      ])

      if (pcRes.ok) {
        const pcData = await pcRes.json()
        setPettyCashFunds(pcData.data ?? pcData ?? [])
      }

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json()
        const items = claimsData.data ?? claimsData ?? []
        setPendingClaims(items)
      }

      if (advRes.ok) {
        const advData = await advRes.json()
        setOutstandingAdvances(advData.data ?? advData ?? [])
      }

      // Fetch recent claims (last 10)
      const recentRes = await fetch('/api/v1/finance/expense-claims?limit=10&sort=-submittedAt')
      if (recentRes.ok) {
        const recentData = await recentRes.json()
        setRecentClaims(recentData.data ?? recentData ?? [])
      }
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── KPI Cards ───

  const kpiCards = [
    {
      title: t('totalPettyCash'),
      value: formatCurrency(totalPettyCash),
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: t('pendingClaims'),
      value: String(pendingClaimsCount),
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: t('outstandingAdvances'),
      value: formatCurrency(totalOutstandingAdvances),
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: t('claimsThisMonth'),
      value: String(claimsThisMonth),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <div className="flex flex-wrap gap-2">
          <Link href="/finance/expenses/petty-cash">
            <Button variant="outline" size="sm">
              <Receipt className="mr-2 h-4 w-4" />
              {t('recordPettyCash')}
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            {t('newAdvanceRequest')}
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('newExpenseClaim')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/finance/expenses/petty-cash">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">{t('pettyCashManagement')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/expenses/categories">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{t('expenseCategories')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/finance/expenses/per-diem">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{t('perDiemRates')}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Expense Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentExpenseClaims')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClaims.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t('noClaims')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('claimNumber')}</TableHead>
                    <TableHead>{t('employee')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>{t('claimDescription')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('submittedDate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                      <TableCell>{claim.employeeName}</TableCell>
                      <TableCell>{claim.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{claim.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(claim.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(claim.status)}>
                          {t(`statuses.${claim.status}` as Parameters<typeof t>[0])}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(claim.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
