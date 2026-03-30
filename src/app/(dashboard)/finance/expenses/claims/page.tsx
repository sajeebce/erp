'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus, ArrowLeft, Loader2, Trash2, Receipt, CheckCircle,
  XCircle, Clock, CreditCard, Upload,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useFormatters } from '@/hooks/use-formatters'

// ---------- types ----------

interface ExpenseClaim {
  id: string
  claimNo: string
  date: string
  employee?: { id: string; name: string }
  purpose: string
  totalAmount: number | string
  status: string
  project?: { id: string; name: string; code?: string }
  grant?: { id: string; name: string; code?: string }
  advanceId?: string | null
  advanceDeducted: number | string
  netPayable: number | string
  items?: ExpenseClaimItem[]
  approvals?: ApprovalEntry[]
  createdAt: string
}

interface ExpenseClaimItem {
  id: string
  date: string
  category: string
  description: string
  amount: number | string
  approvedAmount?: number | string
  hasReceipt: boolean
  account?: { id: string; code: string; name: string }
  location?: string
  tdsRate?: number | string
  vdsRate?: number | string
}

interface ApprovalEntry {
  id: string
  action: string
  actorName: string
  date: string
  comment?: string
}

interface LineItemInput {
  date: string
  categoryId: string
  description: string
  amount: string
  hasReceipt: boolean
  accountId: string
  location: string
  tdsRate: string
  vdsRate: string
}

interface LookupOption {
  id: string
  name: string
  code?: string
}

interface AccountOption {
  id: string
  code: string
  name: string
}

interface AdvanceOption {
  id: string
  advanceNo: string
  amount: number
  purpose: string
}

type ViewState = 'list' | 'create' | 'detail'

const CLAIM_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'SUPERVISOR_APPROVED', 'FINANCE_APPROVED', 'PAID', 'REJECTED'] as const

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function emptyLine(): LineItemInput {
  return { date: todayISO(), categoryId: '', description: '', amount: '', hasReceipt: false, accountId: '', location: '', tdsRate: '', vdsRate: '' }
}

// ---------- component ----------

export default function ExpenseClaimsPage() {
  const t = useTranslations('finance.expenses.claims')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [view, setView] = useState<ViewState>('list')
  const [error, setError] = useState<string | null>(null)

  // -- list state --
  const [claims, setClaims] = useState<ExpenseClaim[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // -- detail state --
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('BANK')

  // -- create state --
  const [purpose, setPurpose] = useState('')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [travelFrom, setTravelFrom] = useState('')
  const [travelTo, setTravelTo] = useState('')
  const [lineItems, setLineItems] = useState<LineItemInput[]>([emptyLine()])
  const [advanceId, setAdvanceId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  // -- lookup data --
  const [projects, setProjects] = useState<LookupOption[]>([])
  const [grants, setGrants] = useState<LookupOption[]>([])
  const [categories, setCategories] = useState<LookupOption[]>([])
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [advances, setAdvances] = useState<AdvanceOption[]>([])

  // ---------- data fetching ----------

  const fetchClaims = useCallback(async () => {
    setListLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (activeTab === 'my') params.set('mine', 'true')
      if (activeTab === 'pending') params.set('pendingApproval', 'true')
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)

      const res = await fetch(`/api/v1/finance/expense-claims?${params}`)
      const json = await res.json()
      if (json.success) setClaims(json.data ?? [])
      else setError(json.error || t('failedToLoad'))
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setListLoading(false)
    }
  }, [filterStatus, activeTab, filterDateFrom, filterDateTo, t])

  const fetchLookups = useCallback(async () => {
    try {
      const [projRes, grantRes, catRes, accRes, advRes] = await Promise.all([
        fetch('/api/v1/projects?limit=100'),
        fetch('/api/v1/donors/grants?limit=100'),
        fetch('/api/v1/finance/expense-categories?limit=100'),
        fetch('/api/v1/finance/chart-of-accounts?limit=200&isGroup=false'),
        fetch('/api/v1/finance/advances?status=DISBURSED&limit=100'),
      ])
      const [projJson, grantJson, catJson, accJson, advJson] = await Promise.all([
        projRes.json(), grantRes.json(), catRes.json(), accRes.json(), advRes.json(),
      ])
      if (projJson.success) setProjects(projJson.data ?? [])
      if (grantJson.success) setGrants(grantJson.data ?? [])
      if (catJson.success) setCategories(catJson.data ?? [])
      if (accJson.success) setAccounts(accJson.data ?? [])
      if (advJson.success) setAdvances(advJson.data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  useEffect(() => {
    if (view === 'create') fetchLookups()
  }, [view, fetchLookups])

  // ---------- detail ----------

  async function openDetail(claim: ExpenseClaim) {
    setView('detail')
    setDetailLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/expense-claims/${claim.id}`)
      const json = await res.json()
      if (json.success) setSelectedClaim(json.data)
      else setError(json.error || t('failedToLoad'))
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------- actions ----------

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    if (!selectedClaim) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/expense-claims/${selectedClaim.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extra ?? {}),
      })
      const json = await res.json()
      if (json.success) {
        setSelectedClaim(json.data)
        fetchClaims()
      } else {
        setError(json.error || 'Action failed')
      }
    } catch {
      setError('Action failed')
    } finally {
      setActionLoading(false)
      setRejectDialogOpen(false)
      setPaymentDialogOpen(false)
    }
  }

  // ---------- create ----------

  const totalAmount = useMemo(() => {
    return lineItems.reduce((sum, li) => sum + (parseFloat(li.amount) || 0), 0)
  }, [lineItems])

  const netPayable = useMemo(() => {
    return Math.max(0, totalAmount - advanceAmount)
  }, [totalAmount, advanceAmount])

  function addLineItem() {
    setLineItems(prev => [...prev, emptyLine()])
  }

  function removeLineItem(idx: number) {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateLineItem(idx: number, field: keyof LineItemInput, value: string | boolean) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, [field]: value } : li))
  }

  function handleAdvanceSelect(id: string) {
    setAdvanceId(id)
    const adv = advances.find(a => a.id === id)
    setAdvanceAmount(adv ? adv.amount : 0)
  }

  async function handleSubmit(asDraft: boolean) {
    if (!purpose.trim()) { setError('Purpose is required'); return }
    if (lineItems.length === 0 || !lineItems.some(li => parseFloat(li.amount) > 0)) {
      setError('At least one line item with amount is required'); return
    }

    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      purpose: purpose.trim(),
      status: asDraft ? 'DRAFT' : 'SUBMITTED',
      items: lineItems.filter(li => parseFloat(li.amount) > 0).map(li => ({
        date: li.date,
        categoryId: li.categoryId || undefined,
        description: li.description,
        amount: parseFloat(li.amount),
        hasReceipt: li.hasReceipt,
        accountId: li.accountId || undefined,
        location: li.location || undefined,
        tdsRate: li.tdsRate ? parseFloat(li.tdsRate) : undefined,
        vdsRate: li.vdsRate ? parseFloat(li.vdsRate) : undefined,
      })),
    }
    if (projectId) payload.projectId = projectId
    if (grantId) payload.grantId = grantId
    if (travelFrom) payload.travelDateFrom = travelFrom
    if (travelTo) payload.travelDateTo = travelTo
    if (advanceId) payload.advanceId = advanceId

    try {
      const res = await fetch('/api/v1/finance/expense-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setView('list')
        resetCreateForm()
        fetchClaims()
      } else {
        setError(json.error || t('failedToCreate'))
      }
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  function resetCreateForm() {
    setPurpose('')
    setProjectId('')
    setGrantId('')
    setTravelFrom('')
    setTravelTo('')
    setLineItems([emptyLine()])
    setAdvanceId('')
    setAdvanceAmount(0)
  }

  // ---------- columns ----------

  const columns: ColumnDef<ExpenseClaim, unknown>[] = useMemo(() => [
    { accessorKey: 'claimNo', header: t('claimNo'), cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.original.claimNo}</span>
    )},
    { accessorKey: 'date', header: t('date'), cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'employee', header: t('employee'), cell: ({ row }) => row.original.employee?.name ?? '-' },
    { accessorKey: 'purpose', header: t('purpose'), cell: ({ row }) => (
      <span className="max-w-[200px] truncate block">{row.original.purpose}</span>
    )},
    { accessorKey: 'totalAmount', header: t('amount'), cell: ({ row }) => formatCurrency(Number(row.original.totalAmount)) },
    { accessorKey: 'status', header: t('status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'project', header: t('project'), cell: ({ row }) => row.original.project?.name ?? '-' },
  ], [t, formatCurrency, formatDate])

  // ---------- render ----------

  if (view === 'detail') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('claimDetail')} description={selectedClaim?.claimNo ?? ''}>
          <Button variant="outline" size="sm" onClick={() => { setView('list'); setSelectedClaim(null) }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}

        {detailLoading ? (
          <Card><CardContent className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>
        ) : selectedClaim ? (
          <>
            {/* Header Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-lg">{selectedClaim.claimNo}</CardTitle>
                    <CardDescription>{selectedClaim.purpose}</CardDescription>
                  </div>
                  <StatusBadge status={selectedClaim.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('employee')}</span>
                    <p className="font-medium">{selectedClaim.employee?.name ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('date')}</span>
                    <p className="font-medium">{formatDate(selectedClaim.date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('project')}</span>
                    <p className="font-medium">{selectedClaim.project?.name ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('grant')}</span>
                    <p className="font-medium">{selectedClaim.grant?.name ?? '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <span className="text-muted-foreground text-sm">{t('total')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedClaim.totalAmount))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-sm">{t('advanceDeducted')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedClaim.advanceDeducted ?? 0))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-sm">{t('netPayable')}</span>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(selectedClaim.netPayable ?? 0))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('lineItems')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('itemDescription')}</TableHead>
                        <TableHead className="text-right">{t('amount')}</TableHead>
                        <TableHead className="text-right">{t('approvedAmount')}</TableHead>
                        <TableHead className="text-center">{t('receipt')}</TableHead>
                        <TableHead>{t('account')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedClaim.items ?? []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(item.amount))}</TableCell>
                          <TableCell className="text-right">{item.approvedAmount != null ? formatCurrency(Number(item.approvedAmount)) : '-'}</TableCell>
                          <TableCell className="text-center">
                            {item.hasReceipt ? <Receipt className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>{item.account ? `${item.account.code} - ${item.account.name}` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {selectedClaim.status === 'SUBMITTED' && (
                    <>
                      <Button onClick={() => handleAction('approve')} disabled={actionLoading}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('approve')}
                      </Button>
                      <Button variant="destructive" onClick={() => setRejectDialogOpen(true)} disabled={actionLoading}>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('reject')}
                      </Button>
                    </>
                  )}
                  {selectedClaim.status === 'SUPERVISOR_APPROVED' && (
                    <>
                      <Button onClick={() => handleAction('finance-approve')} disabled={actionLoading}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('financeApprove')}
                      </Button>
                      <Button variant="destructive" onClick={() => setRejectDialogOpen(true)} disabled={actionLoading}>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('reject')}
                      </Button>
                    </>
                  )}
                  {selectedClaim.status === 'FINANCE_APPROVED' && (
                    <Button onClick={() => setPaymentDialogOpen(true)} disabled={actionLoading}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('processPayment')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Approval Timeline */}
            {(selectedClaim.approvals ?? []).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('approvalTimeline')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(selectedClaim.approvals ?? []).map((approval) => (
                      <div key={approval.id} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {approval.action === 'REJECT' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{approval.action.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">{approval.actorName} - {formatDate(approval.date)}</p>
                          {approval.comment && <p className="text-sm mt-1">{approval.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reject')}</DialogTitle>
              <DialogDescription>{t('rejectReason')}</DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('enterRejectReason')}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>{tc('buttons.cancel')}</Button>
              <Button variant="destructive" onClick={() => handleAction('reject', { reason: rejectReason })} disabled={actionLoading}>
                {t('reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('processPayment')}</DialogTitle>
              <DialogDescription>{t('paymentMethod')}</DialogDescription>
            </DialogHeader>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK">{t('bank')}</SelectItem>
                <SelectItem value="CASH">{t('cash')}</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>{tc('buttons.cancel')}</Button>
              <Button onClick={() => handleAction('process-payment', { method: paymentMethod })} disabled={actionLoading}>
                {t('processPayment')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('createClaim')} description={t('description')}>
          <Button variant="outline" size="sm" onClick={() => { setView('list'); resetCreateForm() }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('createClaim')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="claim-purpose">{t('purpose')} *</Label>
              <Textarea
                id="claim-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={t('purposePlaceholder')}
                rows={3}
              />
            </div>

            {/* Project + Grant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('project')}</Label>
                <SearchableSelect
                  options={[{ value: '_none', label: t('noProject') }, ...projects.map(p => ({ value: p.id, label: `${p.code ? `${p.code} - ` : ''}${p.name}` }))]}
                  value={projectId}
                  onValueChange={(v) => setProjectId(v === '_none' ? '' : v)}
                  placeholder={t('selectProject')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('grant')}</Label>
                <SearchableSelect
                  options={[{ value: '_none', label: t('noGrant') }, ...grants.map(g => ({ value: g.id, label: `${g.code ? `${g.code} - ` : ''}${g.name}` }))]}
                  value={grantId}
                  onValueChange={(v) => setGrantId(v === '_none' ? '' : v)}
                  placeholder={t('selectGrant')}
                />
              </div>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travel-from">{t('travelDateFrom')}</Label>
                <Input id="travel-from" type="date" value={travelFrom} onChange={(e) => setTravelFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travel-to">{t('travelDateTo')}</Label>
                <Input id="travel-to" type="date" value={travelTo} onChange={(e) => setTravelTo(e.target.value)} />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('lineItems')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addItem')}
                </Button>
              </div>

              {lineItems.map((li, idx) => (
                <Card key={idx} className="border-dashed">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                      {lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('date')}</Label>
                        <Input type="date" value={li.date} onChange={(e) => updateLineItem(idx, 'date', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('category')}</Label>
                        <SearchableSelect
                          options={categories.map(c => ({ value: c.id, label: c.name }))}
                          value={li.categoryId}
                          onValueChange={(v) => updateLineItem(idx, 'categoryId', v)}
                          placeholder={t('selectCategory')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('itemAmount')} *</Label>
                        <Input type="number" min="0" step="0.01" value={li.amount} onChange={(e) => updateLineItem(idx, 'amount', e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('itemDescription')}</Label>
                      <Input value={li.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('account')}</Label>
                        <SearchableSelect
                          options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                          value={li.accountId}
                          onValueChange={(v) => updateLineItem(idx, 'accountId', v)}
                          placeholder={t('selectAccount')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('location')}</Label>
                        <Input value={li.location} onChange={(e) => updateLineItem(idx, 'location', e.target.value)} />
                      </div>
                      <div className="flex items-end gap-4 pb-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`receipt-${idx}`}
                            checked={li.hasReceipt}
                            onCheckedChange={(checked) => updateLineItem(idx, 'hasReceipt', String(checked === true))}
                          />
                          <Label htmlFor={`receipt-${idx}`} className="text-sm">{t('hasReceipt')}</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('tdsRate')}</Label>
                        <Input type="number" min="0" max="100" step="0.1" value={li.tdsRate} onChange={(e) => updateLineItem(idx, 'tdsRate', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('vdsRate')}</Label>
                        <Input type="number" min="0" max="100" step="0.1" value={li.vdsRate} onChange={(e) => updateLineItem(idx, 'vdsRate', e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Settle Against Advance */}
            <div className="space-y-2">
              <Label>{t('settleAdvance')}</Label>
              <SearchableSelect
                options={[{ value: '_none', label: '-' }, ...advances.map(a => ({ value: a.id, label: `${a.advanceNo} - ${a.purpose} (${formatCurrency(a.amount)})` }))]}
                value={advanceId}
                onValueChange={(v) => handleAdvanceSelect(v === '_none' ? '' : v)}
                placeholder={t('selectAdvance')}
              />
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('total')}</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              {advanceAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('advanceDeducted')}</span>
                  <span className="font-medium text-amber-600">-{formatCurrency(advanceAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>{t('netPayable')}</span>
                <span className="text-emerald-600">{formatCurrency(netPayable)}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setView('list'); resetCreateForm() }} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('saveAsDraft')}
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('submit')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ---------- list view ----------
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={() => setView('create')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newClaim')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="all">{t('allClaims')}</TabsTrigger>
          <TabsTrigger value="my">{t('myClaims')}</TabsTrigger>
          <TabsTrigger value="pending">{t('pendingApproval')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            {CLAIM_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? t('allClaims') : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-[160px]"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          placeholder={t('dateFrom')}
        />
        <Input
          type="date"
          className="w-[160px]"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          placeholder={t('dateTo')}
        />
      </div>

      <DataTable
        columns={columns}
        data={claims}
        searchKey="purpose"
        searchPlaceholder={t('purpose')}
        onRowClick={openDetail}
        isLoading={listLoading}
        emptyMessage={t('noClaims')}
      />
    </div>
  )
}
