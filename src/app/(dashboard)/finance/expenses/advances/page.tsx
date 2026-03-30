'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus, ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle,
  Banknote, Clock,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { FileUpload } from '@/components/shared/file-upload'
import { useFormatters } from '@/hooks/use-formatters'

// ---------- types ----------

interface Advance {
  id: string
  advanceNo: string
  date: string
  employee?: { id: string; name: string }
  type: string
  purpose: string
  estimatedAmount: number | string
  approvedAmount?: number | string
  disbursedAmount?: number | string
  settledAmount?: number | string
  status: string
  project?: { id: string; name: string; code?: string }
  grant?: { id: string; name: string; code?: string }
  travelStartDate?: string
  travelEndDate?: string
  expectedSettlement?: string
  notes?: string
  createdAt: string
}

interface LookupOption {
  id: string
  name: string
  code?: string
}

interface BankAccount {
  id: string
  accountName: string
  bankName?: string
}

type ViewState = 'list' | 'create' | 'detail'

const ADVANCE_STATUSES = ['ALL', 'REQUESTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'SETTLED', 'PARTIALLY_SETTLED'] as const
const ADVANCE_TYPES = ['TRAVEL', 'ACTIVITY', 'OPERATIONAL'] as const

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// ---------- component ----------

export default function AdvancesPage() {
  const t = useTranslations('finance.expenses.advances')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [view, setView] = useState<ViewState>('list')
  const [error, setError] = useState<string | null>(null)

  // -- list state --
  const [advances, setAdvances] = useState<Advance[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')

  // -- detail state --
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false)
  const [disbursementMethod, setDisbursementMethod] = useState('BANK')
  const [disburseBankAccountId, setDisburseBankAccountId] = useState('')
  const [settleDialogOpen, setSettleDialogOpen] = useState(false)
  const [settledAmount, setSettledAmount] = useState('')

  // -- create state --
  const [purpose, setPurpose] = useState('')
  const [advanceType, setAdvanceType] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [travelFrom, setTravelFrom] = useState('')
  const [travelTo, setTravelTo] = useState('')
  const [expectedSettlement, setExpectedSettlement] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // -- lookup data --
  const [projects, setProjects] = useState<LookupOption[]>([])
  const [grants, setGrants] = useState<LookupOption[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // ---------- data fetching ----------

  const fetchAdvances = useCallback(async () => {
    setListLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (filterType !== 'ALL') params.set('advanceType', filterType)

      const res = await fetch(`/api/v1/finance/advances?${params}`)
      const json = await res.json()
      if (json.success) setAdvances(json.data ?? [])
      else setError(json.error || t('failedToLoad'))
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setListLoading(false)
    }
  }, [filterStatus, filterType, t])

  const fetchLookups = useCallback(async () => {
    try {
      const [projRes, grantRes, bankRes] = await Promise.all([
        fetch('/api/v1/projects?limit=100'),
        fetch('/api/v1/donors/grants?limit=100'),
        fetch('/api/v1/finance/bank-accounts'),
      ])
      const [projJson, grantJson, bankJson] = await Promise.all([
        projRes.json(), grantRes.json(), bankRes.json(),
      ])
      if (projJson.success) setProjects(projJson.data ?? [])
      if (grantJson.success) setGrants(grantJson.data ?? [])
      if (bankJson.success) setBankAccounts(bankJson.data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAdvances() }, [fetchAdvances])

  useEffect(() => {
    if (view === 'create' || view === 'detail') fetchLookups()
  }, [view, fetchLookups])

  // ---------- detail ----------

  async function openDetail(advance: Advance) {
    setView('detail')
    setDetailLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/advances/${advance.id}`)
      const json = await res.json()
      if (json.success) setSelectedAdvance(json.data)
      else setError(json.error || t('failedToLoad'))
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------- actions ----------

  async function handleAction(action: string, extra?: Record<string, unknown>) {
    if (!selectedAdvance) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/advances/${selectedAdvance.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extra ?? {}),
      })
      const json = await res.json()
      if (json.success) {
        setSelectedAdvance(json.data)
        fetchAdvances()
      } else {
        setError(json.error || 'Action failed')
      }
    } catch {
      setError('Action failed')
    } finally {
      setActionLoading(false)
      setRejectDialogOpen(false)
      setDisburseDialogOpen(false)
      setSettleDialogOpen(false)
    }
  }

  // ---------- create ----------

  async function handleSubmit() {
    if (!purpose.trim() || !advanceType || !estimatedAmount) {
      setError('Purpose, type, and estimated amount are required')
      return
    }

    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      purpose: purpose.trim(),
      type: advanceType,
      estimatedAmount: parseFloat(estimatedAmount),
    }
    if (projectId) payload.projectId = projectId
    if (grantId) payload.grantId = grantId
    if (travelFrom) payload.travelStartDate = travelFrom
    if (travelTo) payload.travelEndDate = travelTo
    if (expectedSettlement) payload.expectedSettlement = expectedSettlement
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/finance/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setView('list')
        resetCreateForm()
        fetchAdvances()
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
    setAdvanceType('')
    setEstimatedAmount('')
    setProjectId('')
    setGrantId('')
    setTravelFrom('')
    setTravelTo('')
    setExpectedSettlement('')
    setNotes('')
  }

  // ---------- settlement helpers ----------

  const settlementRefund = useMemo(() => {
    if (!selectedAdvance) return 0
    const disbursed = Number(selectedAdvance.disbursedAmount ?? 0)
    const settled = parseFloat(settledAmount) || 0
    return disbursed - settled
  }, [selectedAdvance, settledAmount])

  // ---------- columns ----------

  const columns: ColumnDef<Advance, unknown>[] = useMemo(() => [
    { accessorKey: 'advanceNo', header: t('advanceNo'), cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.original.advanceNo}</span>
    )},
    { accessorKey: 'date', header: t('date'), cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'employee', header: t('employee'), cell: ({ row }) => row.original.employee?.name ?? '-' },
    { accessorKey: 'type', header: t('type'), cell: ({ row }) => (
      <Badge variant="outline">{t(`types.${row.original.type}`)}</Badge>
    )},
    { accessorKey: 'purpose', header: t('purpose'), cell: ({ row }) => (
      <span className="max-w-[200px] truncate block">{row.original.purpose}</span>
    )},
    { accessorKey: 'estimatedAmount', header: t('amount'), cell: ({ row }) => formatCurrency(Number(row.original.estimatedAmount)) },
    { accessorKey: 'status', header: t('status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'age', header: t('age'), cell: ({ row }) => {
      const days = daysBetween(row.original.date)
      const isOverdue = row.original.status === 'DISBURSED' && days > 30
      return (
        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {days}
        </span>
      )
    }},
  ], [t, formatCurrency, formatDate])

  // ---------- render ----------

  if (view === 'detail') {
    const isOverdue = selectedAdvance?.status === 'DISBURSED' && daysBetween(selectedAdvance.date) > 30

    return (
      <div className="space-y-6">
        <PageHeader title={t('advanceDetail')} description={selectedAdvance?.advanceNo ?? ''}>
          <Button variant="outline" size="sm" onClick={() => { setView('list'); setSelectedAdvance(null) }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}

        {detailLoading ? (
          <Card><CardContent className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>
        ) : selectedAdvance ? (
          <>
            {/* Overdue Warning */}
            {isOverdue && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400 font-medium">{t('overdueWarning')}</span>
              </div>
            )}

            {/* Header Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-lg">{selectedAdvance.advanceNo}</CardTitle>
                    <CardDescription>{selectedAdvance.purpose}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t(`types.${selectedAdvance.type}`)}</Badge>
                    <StatusBadge status={selectedAdvance.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('employee')}</span>
                    <p className="font-medium">{selectedAdvance.employee?.name ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('date')}</span>
                    <p className="font-medium">{formatDate(selectedAdvance.date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('project')}</span>
                    <p className="font-medium">{selectedAdvance.project?.name ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('grant')}</span>
                    <p className="font-medium">{selectedAdvance.grant?.name ?? '-'}</p>
                  </div>
                </div>

                {(selectedAdvance.travelStartDate || selectedAdvance.expectedSettlement) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t">
                    {selectedAdvance.travelStartDate && (
                      <div>
                        <span className="text-muted-foreground">{t('travelStartDate')}</span>
                        <p className="font-medium">{formatDate(selectedAdvance.travelStartDate)}</p>
                      </div>
                    )}
                    {selectedAdvance.travelEndDate && (
                      <div>
                        <span className="text-muted-foreground">{t('travelEndDate')}</span>
                        <p className="font-medium">{formatDate(selectedAdvance.travelEndDate)}</p>
                      </div>
                    )}
                    {selectedAdvance.expectedSettlement && (
                      <div>
                        <span className="text-muted-foreground">{t('expectedSettlement')}</span>
                        <p className="font-medium">{formatDate(selectedAdvance.expectedSettlement)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <span className="text-muted-foreground text-xs">{t('estimatedAmt')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedAdvance.estimatedAmount))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-xs">{t('approvedAmt')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedAdvance.approvedAmount ?? 0))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-xs">{t('disbursedAmt')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedAdvance.disbursedAmount ?? 0))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-xs">{t('settledAmt')}</span>
                    <p className="text-lg font-bold">{formatCurrency(Number(selectedAdvance.settledAmount ?? 0))}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground text-xs">
                      {Number(selectedAdvance.disbursedAmount ?? 0) - Number(selectedAdvance.settledAmount ?? 0) > 0
                        ? t('refundAmount')
                        : t('additionalAmount')}
                    </span>
                    <p className={`text-lg font-bold ${Number(selectedAdvance.disbursedAmount ?? 0) - Number(selectedAdvance.settledAmount ?? 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(Number(selectedAdvance.disbursedAmount ?? 0) - Number(selectedAdvance.settledAmount ?? 0)))}
                    </p>
                  </div>
                </div>

                {selectedAdvance.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-muted-foreground text-sm">{t('notes')}</span>
                    <p className="mt-1 text-sm">{selectedAdvance.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardContent className="pt-6">
                <FileUpload
                  entityType="advance"
                  entityId={selectedAdvance.id}
                  module="finance"
                  readOnly={selectedAdvance.status !== 'REQUESTED'}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {selectedAdvance.status === 'REQUESTED' && (
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
                  {selectedAdvance.status === 'APPROVED' && (
                    <Button onClick={() => setDisburseDialogOpen(true)} disabled={actionLoading}>
                      <Banknote className="h-4 w-4 mr-2" />
                      {t('disburse')}
                    </Button>
                  )}
                  {selectedAdvance.status === 'DISBURSED' && (
                    <Button onClick={() => { setSettledAmount(String(Number(selectedAdvance.disbursedAmount ?? 0))); setSettleDialogOpen(true) }} disabled={actionLoading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('settle')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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

        {/* Disburse Dialog */}
        <Dialog open={disburseDialogOpen} onOpenChange={setDisburseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('disburse')}</DialogTitle>
              <DialogDescription>{t('disbursementMethod')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={disbursementMethod} onValueChange={setDisbursementMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">{t('bank')}</SelectItem>
                  <SelectItem value="CASH">{t('cash')}</SelectItem>
                </SelectContent>
              </Select>
              {disbursementMethod === 'BANK' && (
                <SearchableSelect
                  options={bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName}${ba.bankName ? ` - ${ba.bankName}` : ''}` }))}
                  value={disburseBankAccountId}
                  onValueChange={setDisburseBankAccountId}
                  placeholder={t('selectBankAccount')}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisburseDialogOpen(false)}>{tc('buttons.cancel')}</Button>
              <Button onClick={() => handleAction('disburse', { method: disbursementMethod, bankAccountId: disburseBankAccountId || undefined })} disabled={actionLoading}>
                {t('disburse')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settle Dialog */}
        <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settle')}</DialogTitle>
              <DialogDescription>{t('settledAmount')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settledAmount')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settledAmount}
                  onChange={(e) => setSettledAmount(e.target.value)}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{t('disbursedAmt')}</span>
                  <span>{formatCurrency(Number(selectedAdvance?.disbursedAmount ?? 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settledAmount')}</span>
                  <span>{formatCurrency(parseFloat(settledAmount) || 0)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>{settlementRefund >= 0 ? t('refundAmount') : t('additionalAmount')}</span>
                  <span className={settlementRefund >= 0 ? 'text-amber-600' : 'text-red-600'}>
                    {formatCurrency(Math.abs(settlementRefund))}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('settlementDocs')}</Label>
                <FileUpload entityType="advance_settlement" entityId={null} module="finance" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>{tc('buttons.cancel')}</Button>
              <Button onClick={() => handleAction('settle', { settledAmount: parseFloat(settledAmount) })} disabled={actionLoading}>
                {t('settle')}
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
        <PageHeader title={t('createAdvance')} description={t('description')}>
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
            <CardTitle>{t('createAdvance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="adv-purpose">{t('purpose')} *</Label>
              <Textarea
                id="adv-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>

            {/* Type + Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('advanceType')} *</Label>
                <SearchableSelect
                  options={ADVANCE_TYPES.map(at => ({ value: at, label: t(`types.${at}`) }))}
                  value={advanceType}
                  onValueChange={setAdvanceType}
                  placeholder={t('selectType')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adv-amount">{t('estimatedAmount')} *</Label>
                <Input
                  id="adv-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                />
              </div>
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

            {/* Travel Dates (conditional) */}
            {advanceType === 'TRAVEL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-travel-from">{t('travelStartDate')}</Label>
                  <Input id="adv-travel-from" type="date" value={travelFrom} onChange={(e) => setTravelFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-travel-to">{t('travelEndDate')}</Label>
                  <Input id="adv-travel-to" type="date" value={travelTo} onChange={(e) => setTravelTo(e.target.value)} />
                </div>
              </div>
            )}

            {/* Expected Settlement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adv-settlement">{t('expectedSettlement')}</Label>
                <Input id="adv-settlement" type="date" value={expectedSettlement} onChange={(e) => setExpectedSettlement(e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="adv-notes">{t('notes')}</Label>
              <Textarea
                id="adv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>

            {/* Supporting Documents */}
            <FileUpload entityType="advance" entityId={null} module="finance" />
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setView('list'); resetCreateForm() }} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('submitAdvance')}
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
          {t('newAdvance')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            {ADVANCE_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? tc('buttons.all') ?? 'All' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterByType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc('buttons.all') ?? 'All'}</SelectItem>
            {ADVANCE_TYPES.map(at => (
              <SelectItem key={at} value={at}>{t(`types.${at}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={advances}
        searchKey="purpose"
        searchPlaceholder={t('purpose')}
        onRowClick={openDetail}
        isLoading={listLoading}
        emptyMessage={t('noAdvances')}
      />
    </div>
  )
}
