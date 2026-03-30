'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Loader2,
  Plus,
  Wallet,
  RefreshCw,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { FileUpload } from '@/components/shared/file-upload'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface PettyCashTransaction {
  id: string
  date: string
  action: string
  amount: number
  description: string
  category: string
  balanceAfter: number
}

interface PettyCashFund {
  id: string
  name: string
  code: string
  location: string
  imprestAmount: number
  currentBalance: number
  custodianId: string
  custodianName: string
  lastReconciledAt: string | null
  notes: string | null
  transactions?: PettyCashTransaction[]
}

interface Employee {
  id: string
  name: string
}

interface ExpenseCategory {
  id: string
  code: string
  name: string
}

// ─── Helpers ───

function balanceColor(pct: number): string {
  if (pct >= 0.5) return 'bg-emerald-500'
  if (pct >= 0.25) return 'bg-amber-500'
  return 'bg-red-500'
}

function actionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'EXPENSE': return 'destructive'
    case 'REPLENISH': return 'default'
    case 'RECONCILE': return 'secondary'
    default: return 'outline'
  }
}

// ─── Main Page ───

export default function PettyCashPage() {
  const t = useTranslations('finance.expenses.pettyCash')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [funds, setFunds] = useState<PettyCashFund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [replenishOpen, setReplenishOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [activeFundId, setActiveFundId] = useState<string | null>(null)

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [glAccounts, setGlAccounts] = useState<{ id: string; code: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; projectNo: string }[]>([])

  // Record Expense form
  const [reDate, setReDate] = useState('')
  const [reAmount, setReAmount] = useState('')
  const [reDescription, setReDescription] = useState('')
  const [reCategoryId, setReCategoryId] = useState('')
  const [reAccountId, setReAccountId] = useState('')
  const [reProjectId, setReProjectId] = useState('')
  const [reNotes, setReNotes] = useState('')

  // Replenish form
  const [rpAmount, setRpAmount] = useState('')
  const [rpNotes, setRpNotes] = useState('')

  // Reconcile form
  const [rcPhysicalCount, setRcPhysicalCount] = useState('')

  // ─── Fetch ───

  const fetchFunds = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/finance/petty-cash')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFunds(data.data ?? data ?? [])
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchLookups = useCallback(async () => {
    try {
      const [empRes, catRes, accRes, projRes] = await Promise.all([
        fetch('/api/v1/hr/employees?limit=200'),
        fetch('/api/v1/finance/expense-categories'),
        fetch('/api/v1/finance/accounts?isGroup=false&type=EXPENSE&limit=500'),
        fetch('/api/v1/projects?limit=200'),
      ])
      if (empRes.ok) {
        const d = await empRes.json()
        const items = d.data ?? d ?? []
        setEmployees(items.map((e: Record<string, string>) => ({
          id: e.id,
          name: e.fullName ?? e.name ?? '',
        })))
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setExpenseCategories(d.data ?? d ?? [])
      }
      if (accRes.ok) {
        const d = await accRes.json()
        setGlAccounts(d.data ?? d ?? [])
      }
      if (projRes.ok) {
        const d = await projRes.json()
        setProjects(d.data ?? d ?? [])
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => { fetchFunds(); fetchLookups() }, [fetchFunds, fetchLookups])

  // ─── Fetch transactions when a fund is expanded ───

  const [fundTransactions, setFundTransactions] = useState<Record<string, PettyCashTransaction[]>>({})
  const [txLoading, setTxLoading] = useState(false)

  useEffect(() => {
    if (!expandedFundId) return
    // Skip if already fetched
    if (fundTransactions[expandedFundId]) return
    let cancelled = false
    const fetchTx = async () => {
      setTxLoading(true)
      try {
        const res = await fetch(`/api/v1/finance/petty-cash/${expandedFundId}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const fund = data.data ?? data
        if (!cancelled) {
          setFundTransactions(prev => ({
            ...prev,
            [expandedFundId]: fund.recentTransactions ?? fund.transactions ?? [],
          }))
        }
      } catch {
        // Non-critical — transactions just won't show
      } finally {
        if (!cancelled) setTxLoading(false)
      }
    }
    fetchTx()
    return () => { cancelled = true }
  }, [expandedFundId, fundTransactions])

  // ─── Toggle expand fund ───

  const toggleFund = (id: string) => {
    setExpandedFundId(expandedFundId === id ? null : id)
  }

  // ─── Create Fund ───

  // ─── Record Expense ───

  const resetExpenseForm = () => {
    setReDate(''); setReAmount(''); setReDescription('');
    setReCategoryId(''); setReAccountId(''); setReProjectId(''); setReNotes('')
  }

  const handleRecordExpense = async () => {
    if (!activeFundId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/finance/petty-cash/${activeFundId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: reDate,
          action: 'EXPENSE',
          amount: parseFloat(reAmount) || 0,
          description: reDescription,
          category: reCategoryId || null,
          accountId: reAccountId || null,
          projectId: reProjectId || null,
          notes: reNotes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message || json.error || t('failedToRecordExpense')); return }
      setExpenseOpen(false)
      resetExpenseForm()
      setFundTransactions(prev => { const next = { ...prev }; delete next[activeFundId]; return next })
      fetchFunds()
    } catch {
      setError(t('failedToRecordExpense'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Replenish ───

  const handleReplenish = async () => {
    if (!activeFundId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/finance/petty-cash/${activeFundId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          action: 'REPLENISHMENT',
          amount: parseFloat(rpAmount) || 0,
          description: `Petty cash replenishment${rpNotes ? ': ' + rpNotes : ''}`,
          notes: rpNotes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message || json.error || t('failedToReplenish')); return }
      setReplenishOpen(false)
      setRpAmount(''); setRpNotes('')
      if (activeFundId) setFundTransactions(prev => { const next = { ...prev }; delete next[activeFundId]; return next })
      fetchFunds()
    } catch {
      setError(t('failedToReplenish'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Reconcile ───

  const activeFund = funds.find((f) => f.id === activeFundId)
  const reconcileDifference = activeFund
    ? (parseFloat(rcPhysicalCount) || 0) - activeFund.currentBalance
    : 0

  const handleReconcile = async () => {
    if (!activeFundId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/finance/petty-cash/${activeFundId}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physicalCount: parseFloat(rcPhysicalCount) || 0,
        }),
      })
      if (!res.ok) throw new Error()
      setReconcileOpen(false)
      setRcPhysicalCount('')
      if (activeFundId) setFundTransactions(prev => { const next = { ...prev }; delete next[activeFundId]; return next })
      fetchFunds()
    } catch {
      setError(t('failedToReconcile'))
    } finally {
      setSaving(false)
    }
  }

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
        <Button asChild>
          <Link href="/finance/expenses/petty-cash/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('createFund')}
          </Link>
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {funds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noFunds')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {funds.map((fund) => {
            const pct = fund.imprestAmount > 0
              ? fund.currentBalance / fund.imprestAmount
              : 0
            const isExpanded = expandedFundId === fund.id

            return (
              <Card key={fund.id} className="flex flex-col">
                {/* Fund Summary */}
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleFund(fund.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        {fund.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {fund.code} &middot; {fund.location}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Balance info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('imprestAmount')}</span>
                      <span className="font-medium">{formatCurrency(fund.imprestAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('currentBalance')}</span>
                      <span className="text-lg font-bold">{formatCurrency(fund.currentBalance)}</span>
                    </div>

                    {/* Balance bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${balanceColor(pct)}`}
                        style={{ width: `${Math.min(pct * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('custodian')}</span>
                      <span>{fund.custodianName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('lastReconciled')}</span>
                      <span>
                        {fund.lastReconciledAt ? formatDate(fund.lastReconciledAt) : t('never')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: Transactions + Actions */}
                  {isExpanded && (
                    <div className="space-y-4 pt-2">
                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFundId(fund.id)
                            setExpenseOpen(true)
                          }}
                        >
                          <Receipt className="mr-1 h-3 w-3" />
                          {t('recordExpense')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFundId(fund.id)
                            setReplenishOpen(true)
                          }}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          {t('replenish')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveFundId(fund.id)
                            setRcPhysicalCount('')
                            setReconcileOpen(true)
                          }}
                        >
                          <ClipboardCheck className="mr-1 h-3 w-3" />
                          {t('reconcile')}
                        </Button>
                      </div>

                      {/* Recent Transactions */}
                      {txLoading && expandedFundId === fund.id ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (fundTransactions[fund.id] ?? fund.transactions ?? []).length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('txDate')}</TableHead>
                                <TableHead>{t('txAction')}</TableHead>
                                <TableHead className="text-right">{t('txAmount')}</TableHead>
                                <TableHead>{t('txDescription')}</TableHead>
                                <TableHead>{t('txCategory')}</TableHead>
                                <TableHead className="text-right">{t('txBalanceAfter')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(fundTransactions[fund.id] ?? fund.transactions ?? []).map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                                  <TableCell>
                                    <Badge variant={actionVariant(tx.action)}>
                                      {t(`actions.${tx.action}` as Parameters<typeof t>[0])}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(tx.amount)}
                                  </TableCell>
                                  <TableCell className="max-w-[150px] truncate text-sm">
                                    {tx.description}
                                  </TableCell>
                                  <TableCell className="text-sm">{tx.category}</TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatCurrency(tx.balanceAfter)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          {t('noTransactions')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Record Expense Dialog ─── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('recordExpense')}</DialogTitle>
            <DialogDescription>{t('recordExpenseDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="re-date">{t('expenseDate')}</Label>
                <Input id="re-date" type="date" value={reDate} onChange={(e) => setReDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="re-amount">{t('expenseAmount')}</Label>
                <Input id="re-amount" type="number" value={reAmount} onChange={(e) => setReAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="re-desc">{t('expenseDescription')}</Label>
              <Input id="re-desc" value={reDescription} onChange={(e) => setReDescription(e.target.value)} placeholder={t('expenseDescriptionPlaceholder')} />
            </div>
            <div className="grid gap-2">
              <Label>{t('expenseCategory')}</Label>
              <SearchableSelect
                options={expenseCategories.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                value={reCategoryId}
                onValueChange={setReCategoryId}
                placeholder={t('selectCategory')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('glAccount')}</Label>
              <SearchableSelect
                options={glAccounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                value={reAccountId}
                onValueChange={setReAccountId}
                placeholder={t('selectGlAccount')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('project')}</Label>
              <SearchableSelect
                options={projects.map((p) => ({ value: p.id, label: `${p.projectNo} - ${p.name}` }))}
                value={reProjectId}
                onValueChange={setReProjectId}
                placeholder={t('selectProject')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('receipt')}</Label>
              <FileUpload entityType="petty_cash_expense" entityId={null} module="finance" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="re-notes">{t('notes')}</Label>
              <Textarea id="re-notes" value={reNotes} onChange={(e) => setReNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleRecordExpense} disabled={saving || !reDate || !reAmount}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('recordExpense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Replenish Dialog ─── */}
      <Dialog open={replenishOpen} onOpenChange={setReplenishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('replenish')}</DialogTitle>
            <DialogDescription>{t('replenishDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rp-amount">{t('replenishAmount')}</Label>
              <Input id="rp-amount" type="number" value={rpAmount} onChange={(e) => setRpAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rp-notes">{t('notes')}</Label>
              <Textarea id="rp-notes" value={rpNotes} onChange={(e) => setRpNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplenishOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleReplenish} disabled={saving || !rpAmount}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('replenish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reconcile Dialog ─── */}
      <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reconcile')}</DialogTitle>
            <DialogDescription>{t('reconcileDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {activeFund && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bookBalance')}</span>
                  <span className="font-medium">{formatCurrency(activeFund.currentBalance)}</span>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="rc-count">{t('physicalCount')}</Label>
              <Input
                id="rc-count"
                type="number"
                value={rcPhysicalCount}
                onChange={(e) => setRcPhysicalCount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {rcPhysicalCount && (
              <div className={`rounded-md p-3 text-sm ${reconcileDifference === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <div className="flex justify-between">
                  <span>{t('difference')}</span>
                  <span className="font-bold">{formatCurrency(reconcileDifference)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconcileOpen(false)}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleReconcile} disabled={saving || !rcPhysicalCount}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('confirmReconcile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
