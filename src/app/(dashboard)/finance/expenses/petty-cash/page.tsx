'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const [createOpen, setCreateOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [replenishOpen, setReplenishOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [activeFundId, setActiveFundId] = useState<string | null>(null)

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])

  // Create Fund form
  const [cfName, setCfName] = useState('')
  const [cfCode, setCfCode] = useState('')
  const [cfImprest, setCfImprest] = useState('')
  const [cfCustodianId, setCfCustodianId] = useState('')
  const [cfLocation, setCfLocation] = useState('')
  const [cfNotes, setCfNotes] = useState('')

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
      const [empRes, catRes] = await Promise.all([
        fetch('/api/v1/hr/employees?limit=200'),
        fetch('/api/v1/finance/expense-categories'),
      ])
      if (empRes.ok) {
        const d = await empRes.json()
        const items = d.data ?? d ?? []
        setEmployees(items.map((e: Record<string, string>) => ({
          id: e.id,
          name: e.name ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
        })))
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setExpenseCategories(d.data ?? d ?? [])
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => { fetchFunds(); fetchLookups() }, [fetchFunds, fetchLookups])

  // ─── Toggle expand fund ───

  const toggleFund = (id: string) => {
    setExpandedFundId(expandedFundId === id ? null : id)
  }

  // ─── Create Fund ───

  const resetCreateForm = () => {
    setCfName(''); setCfCode(''); setCfImprest(''); setCfCustodianId('');
    setCfLocation(''); setCfNotes('')
  }

  const handleCreateFund = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/finance/petty-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cfName,
          code: cfCode,
          imprestAmount: parseFloat(cfImprest) || 0,
          custodianId: cfCustodianId,
          location: cfLocation,
          notes: cfNotes || null,
        }),
      })
      if (!res.ok) throw new Error()
      setCreateOpen(false)
      resetCreateForm()
      fetchFunds()
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  // ─── Record Expense ───

  const resetExpenseForm = () => {
    setReDate(''); setReAmount(''); setReDescription('');
    setReCategoryId(''); setReAccountId(''); setReProjectId(''); setReNotes('')
  }

  const handleRecordExpense = async () => {
    if (!activeFundId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/finance/petty-cash/${activeFundId}/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: reDate,
          amount: parseFloat(reAmount) || 0,
          description: reDescription,
          categoryId: reCategoryId || null,
          accountId: reAccountId || null,
          projectId: reProjectId || null,
          notes: reNotes || null,
        }),
      })
      if (!res.ok) throw new Error()
      setExpenseOpen(false)
      resetExpenseForm()
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
    try {
      const res = await fetch(`/api/v1/finance/petty-cash/${activeFundId}/replenish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(rpAmount) || 0,
          notes: rpNotes || null,
        }),
      })
      if (!res.ok) throw new Error()
      setReplenishOpen(false)
      setRpAmount(''); setRpNotes('')
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
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createFund')}
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
                      {fund.transactions && fund.transactions.length > 0 ? (
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
                              {fund.transactions.map((tx) => (
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

      {/* ─── Create Fund Dialog ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('createFund')}</DialogTitle>
            <DialogDescription>{t('createFundDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cf-name">{t('fundName')}</Label>
              <Input id="cf-name" value={cfName} onChange={(e) => setCfName(e.target.value)} placeholder={t('fundNamePlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cf-code">{t('fundCode')}</Label>
                <Input id="cf-code" value={cfCode} onChange={(e) => setCfCode(e.target.value)} placeholder={t('fundCodePlaceholder')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cf-imprest">{t('imprestAmount')}</Label>
                <Input id="cf-imprest" type="number" value={cfImprest} onChange={(e) => setCfImprest(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('custodian')}</Label>
              <SearchableSelect
                options={employees.map((e) => ({ value: e.id, label: e.name }))}
                value={cfCustodianId}
                onValueChange={setCfCustodianId}
                placeholder={t('selectCustodian')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-location">{t('location')}</Label>
              <Input id="cf-location" value={cfLocation} onChange={(e) => setCfLocation(e.target.value)} placeholder={t('locationPlaceholder')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-notes">{t('notes')}</Label>
              <Textarea id="cf-notes" value={cfNotes} onChange={(e) => setCfNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{tc('cancel')}</Button>
            <Button onClick={handleCreateFund} disabled={saving || !cfName || !cfCode}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createFund')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Record Expense Dialog ─── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="re-account">{t('glAccount')}</Label>
                <Input id="re-account" value={reAccountId} onChange={(e) => setReAccountId(e.target.value)} placeholder={t('glAccountPlaceholder')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="re-project">{t('project')}</Label>
                <Input id="re-project" value={reProjectId} onChange={(e) => setReProjectId(e.target.value)} placeholder={t('projectPlaceholder')} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('receipt')}</Label>
              <div className="flex h-20 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
                {t('receiptUploadPlaceholder')}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="re-notes">{t('notes')}</Label>
              <Textarea id="re-notes" value={reNotes} onChange={(e) => setReNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>{tc('cancel')}</Button>
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
            <Button variant="outline" onClick={() => setReplenishOpen(false)}>{tc('cancel')}</Button>
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
            <Button variant="outline" onClick={() => setReconcileOpen(false)}>{tc('cancel')}</Button>
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
