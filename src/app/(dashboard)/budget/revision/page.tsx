'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Download,
  ArrowLeft,
  Loader2,
  FileEdit,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useFormatters } from '@/hooks/use-formatters'

// ---------- types ----------

interface BudgetRevisionLine {
  id: string
  budgetLineId: string
  originalAmount: string | number
  revisedAmount: string | number
  changeAmount: string | number
  budgetLine?: {
    id: string
    description?: string
    category?: string
    totalAmount: string | number
    account?: { id: string; code: string; name: string }
  }
}

interface BudgetRevision {
  id: string
  revisionNo: string
  budgetId: string
  date: string
  originalTotal: string | number
  revisedTotal: string | number
  changeAmount: string | number
  changePercent: string | number
  reason: string
  status: string
  approvedById?: string | null
  approvedAt?: string | null
  createdAt: string
  updatedAt: string
  budget?: { id: string; name: string }
  lines?: BudgetRevisionLine[]
  _count?: { lines: number }
}

interface BudgetOption {
  id: string
  name: string
  budgetCode: string
  totalAmount: string | number
  status: string
  project?: { id: string; name: string }
}

interface BudgetLineItem {
  id: string
  description?: string
  category?: string
  totalAmount: string | number
  account?: { id: string; code: string; name: string }
}

interface BudgetDetail {
  id: string
  name: string
  totalAmount: string | number
  lines: BudgetLineItem[]
}

interface RevisionLineInput {
  budgetLineId: string
  description: string
  accountName: string
  originalAmount: number
  revisedAmount: number
  changeAmount: number
  changePercent: number
}

type ViewState = 'list' | 'create' | 'detail'

// ---------- component ----------

export default function BudgetRevisionPage() {
  const t = useTranslations('budget.revision')
  const tc = useTranslations('common')
  const { formatCurrency, formatPercent, formatDate } = useFormatters()

  // -- shared state --
  const [view, setView] = useState<ViewState>('list')
  const [error, setError] = useState<string | null>(null)

  // -- list state --
  const [revisions, setRevisions] = useState<BudgetRevision[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [filterBudgetId, setFilterBudgetId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [budgetOptions, setBudgetOptions] = useState<BudgetOption[]>([])

  // -- detail state --
  const [selectedRevision, setSelectedRevision] = useState<BudgetRevision | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // -- create state --
  const [createStep, setCreateStep] = useState(1)
  const [selectedBudgetId, setSelectedBudgetId] = useState('')
  const [activeBudgets, setActiveBudgets] = useState<BudgetOption[]>([])
  const [budgetDetail, setBudgetDetail] = useState<BudgetDetail | null>(null)
  const [revisionLines, setRevisionLines] = useState<RevisionLineInput[]>([])
  const [revisionReason, setRevisionReason] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ---------- data fetching ----------

  const fetchRevisions = useCallback(async () => {
    setListLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filterBudgetId && filterBudgetId !== 'all') params.set('budgetId', filterBudgetId)
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/v1/budget/revisions?${params}`)
      const json = await res.json()
      if (json.success) {
        setRevisions(json.data)
      } else {
        setError(json.error || t('failedToLoad'))
      }
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setListLoading(false)
    }
  }, [filterBudgetId, filterStatus, t])

  const fetchBudgetOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/budget?limit=200')
      const json = await res.json()
      if (json.success) setBudgetOptions(json.data)
    } catch {
      /* silent */
    }
  }, [])

  const fetchActiveBudgets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/budget?status=ACTIVE&limit=200')
      const json = await res.json()
      if (json.success) setActiveBudgets(json.data)
    } catch {
      /* silent */
    }
  }, [])

  const fetchBudgetDetail = useCallback(async (budgetId: string) => {
    setBudgetLoading(true)
    try {
      const res = await fetch(`/api/v1/budget/${budgetId}`)
      const json = await res.json()
      if (json.success) {
        const budget = json.data as BudgetDetail
        setBudgetDetail(budget)
        setRevisionLines(
          budget.lines.map((line) => {
            const origAmt = Number(line.totalAmount)
            return {
              budgetLineId: line.id,
              description: line.description || '',
              accountName: line.account ? `${line.account.code} - ${line.account.name}` : '',
              originalAmount: origAmt,
              revisedAmount: origAmt,
              changeAmount: 0,
              changePercent: 0,
            }
          })
        )
      }
    } catch {
      /* silent */
    } finally {
      setBudgetLoading(false)
    }
  }, [])

  // initial load
  useEffect(() => {
    fetchRevisions()
    fetchBudgetOptions()
  }, [fetchRevisions, fetchBudgetOptions])

  // ---------- summary stats ----------

  const stats = useMemo(() => {
    const total = revisions.length
    const approved = revisions.filter((r) => r.status === 'APPROVED').length
    const pending = revisions.filter((r) => r.status === 'DRAFT' || r.status === 'SUBMITTED').length
    const impact = revisions
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + Number(r.changeAmount), 0)
    return { total, approved, pending, impact }
  }, [revisions])

  // ---------- create form helpers ----------

  const updateRevisionLine = (index: number, revisedAmount: number) => {
    setRevisionLines((prev) => {
      const next = [...prev]
      const line = { ...next[index] }
      line.revisedAmount = revisedAmount
      line.changeAmount = revisedAmount - line.originalAmount
      line.changePercent =
        line.originalAmount > 0
          ? Math.round(((revisedAmount - line.originalAmount) / line.originalAmount) * 10000) / 100
          : 0
      next[index] = line
      return next
    })
  }

  const createSummary = useMemo(() => {
    const originalTotal = revisionLines.reduce((s, l) => s + l.originalAmount, 0)
    const revisedTotal = revisionLines.reduce((s, l) => s + l.revisedAmount, 0)
    const changeAmount = revisedTotal - originalTotal
    const changePercent =
      originalTotal > 0 ? Math.round((changeAmount / originalTotal) * 10000) / 100 : 0
    return { originalTotal, revisedTotal, changeAmount, changePercent }
  }, [revisionLines])

  const handleSubmitRevision = async () => {
    if (!selectedBudgetId || !revisionReason.trim()) return
    const changedLines = revisionLines.filter((l) => l.changeAmount !== 0)
    if (changedLines.length === 0) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/budget/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: selectedBudgetId,
          reason: revisionReason.trim(),
          lines: changedLines.map((l) => ({
            budgetLineId: l.budgetLineId,
            revisedAmount: l.revisedAmount,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        resetCreateForm()
        setView('list')
        fetchRevisions()
      } else {
        setError(json.error || t('failedToCreate'))
      }
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetCreateForm = () => {
    setCreateStep(1)
    setSelectedBudgetId('')
    setBudgetDetail(null)
    setRevisionLines([])
    setRevisionReason('')
    setError(null)
  }

  // ---------- detail actions ----------

  const handleStatusAction = async (action: string, reason?: string) => {
    if (!selectedRevision) return
    setActionLoading(true)
    setError(null)
    try {
      let url: string
      let body: Record<string, string>

      if (action === 'approve') {
        url = `/api/v1/budget/revisions/${selectedRevision.id}/approve`
        body = {}
      } else if (action === 'submit') {
        // Use the budget status endpoint to transition budget
        // For revisions, we just update status concept via approve endpoint
        url = `/api/v1/budget/revisions/${selectedRevision.id}/approve`
        body = {}
      } else if (action === 'reject') {
        // No dedicated reject endpoint - use status change concept
        url = `/api/v1/budget/${selectedRevision.budgetId}/status`
        body = { action: 'reject', reason: reason || '' }
      } else {
        return
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setView('list')
        setSelectedRevision(null)
        fetchRevisions()
      } else {
        setError(json.error || t('actionFailed'))
      }
    } catch {
      setError(t('actionFailed'))
    } finally {
      setActionLoading(false)
      setRejectDialogOpen(false)
      setRejectReason('')
    }
  }

  const handleDelete = async () => {
    if (!selectedRevision) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/budget/revisions/${selectedRevision.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success || res.status === 204) {
        setView('list')
        setSelectedRevision(null)
        fetchRevisions()
      } else {
        setError(json.error || t('failedToDelete'))
      }
    } catch {
      setError(t('failedToDelete'))
    } finally {
      setActionLoading(false)
      setDeleteConfirmOpen(false)
    }
  }

  // ---------- table columns ----------

  const columns: ColumnDef<BudgetRevision>[] = [
    {
      accessorKey: 'revisionNo',
      header: t('revisionNo'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.getValue('revisionNo')}</span>
      ),
    },
    {
      accessorKey: 'budget.name',
      header: t('budgetName'),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.budget?.name || '\u2014'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('date'),
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.date || row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'originalTotal',
      header: t('originalTotal'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-right block">
          {formatCurrency(Number(row.original.originalTotal))}
        </span>
      ),
    },
    {
      accessorKey: 'revisedTotal',
      header: t('revisedTotal'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-right block">
          {formatCurrency(Number(row.original.revisedTotal))}
        </span>
      ),
    },
    {
      accessorKey: 'changePercent',
      header: t('changePercent'),
      cell: ({ row }) => {
        const pct = Number(row.original.changePercent)
        return (
          <span
            className={`font-mono text-sm text-right block ${
              pct > 0 ? 'text-red-600' : pct < 0 ? 'text-green-600' : ''
            }`}
          >
            {pct > 0 ? '+' : ''}
            {formatPercent(pct)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  // ---------- render helpers ----------

  const renderError = () =>
    error ? (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    ) : null

  const renderStatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('totalRevisions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('approved')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('pending')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('totalImpact')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              stats.impact >= 0 ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {stats.impact >= 0 ? '+' : ''}
            {formatCurrency(stats.impact)}
          </p>
        </CardContent>
      </Card>
    </div>
  )

  // ==================== VIEW: LIST ====================

  const renderListView = () => (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            resetCreateForm()
            fetchActiveBudgets()
            setView('create')
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newRevision')}
        </Button>
      </PageHeader>

      {renderError()}
      {renderStatCards()}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-55">
          <Select value={filterBudgetId} onValueChange={setFilterBudgetId}>
            <SelectTrigger>
              <SelectValue placeholder={t('filterByBudget')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('filters.all')}</SelectItem>
              {budgetOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-45">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('filters.all')}</SelectItem>
              <SelectItem value="DRAFT">{tc('status.DRAFT')}</SelectItem>
              <SelectItem value="SUBMITTED">{tc('status.SUBMITTED')}</SelectItem>
              <SelectItem value="APPROVED">{tc('status.APPROVED')}</SelectItem>
              <SelectItem value="REJECTED">{tc('status.REJECTED')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={revisions}
        searchKey="revisionNo"
        searchPlaceholder={t('searchRevisions')}
        isLoading={listLoading}
        onRowClick={(row) => {
          setSelectedRevision(row)
          setView('detail')
        }}
      />
    </div>
  )

  // ==================== VIEW: CREATE ====================

  const renderCreateView = () => (
    <div className="space-y-6">
      <PageHeader
        title={t('createRevision')}
        description={t('createRevisionDesc')}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetCreateForm()
            setView('list')
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {renderError()}

      {/* Step 1: Select Budget */}
      <Card>
        <CardHeader>
          <CardTitle>{t('step1SelectBudget')}</CardTitle>
          <CardDescription>{t('step1Desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <SearchableSelect
              options={activeBudgets.map((b) => ({
                value: b.id,
                label: `${b.budgetCode || ''} ${b.name}`.trim(),
                description: b.project?.name,
              }))}
              value={selectedBudgetId}
              onValueChange={(val) => {
                setSelectedBudgetId(val)
                if (val) {
                  fetchBudgetDetail(val)
                  setCreateStep(2)
                }
              }}
              placeholder={t('selectBudget')}
              searchPlaceholder={t('searchBudgets')}
            />
          </div>
          {createLoading && (
            <div className="flex items-center gap-2 mt-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tc('loading')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Revision Lines */}
      {createStep >= 2 && budgetDetail && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('step2ReviseLines')}</CardTitle>
              <CardDescription>{t('step2Desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc('loading')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-50">{t('lineDescription')}</TableHead>
                        <TableHead className="text-right min-w-32.5">{t('currentAmount')}</TableHead>
                        <TableHead className="text-right min-w-37.5">{t('revisedAmount')}</TableHead>
                        <TableHead className="text-right min-w-30">{t('changeAmt')}</TableHead>
                        <TableHead className="text-right min-w-22.5">{t('changePercent')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revisionLines.map((line, idx) => (
                        <TableRow key={line.budgetLineId}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{line.accountName || line.description || `Line ${idx + 1}`}</p>
                              {line.description && line.accountName && (
                                <p className="text-xs text-muted-foreground">{line.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(line.originalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.revisedAmount}
                              onChange={(e) =>
                                updateRevisionLine(idx, parseFloat(e.target.value) || 0)
                              }
                              className="text-right font-mono text-sm w-35 ml-auto"
                            />
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${
                              line.changeAmount > 0
                                ? 'text-red-600'
                                : line.changeAmount < 0
                                ? 'text-green-600'
                                : ''
                            }`}
                          >
                            {line.changeAmount > 0 ? '+' : ''}
                            {formatCurrency(line.changeAmount)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${
                              line.changePercent > 0
                                ? 'text-red-600'
                                : line.changePercent < 0
                                ? 'text-green-600'
                                : ''
                            }`}
                          >
                            {line.changePercent > 0 ? '+' : ''}
                            {formatPercent(line.changePercent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('impactSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('originalTotal')}</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(createSummary.originalTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('revisedTotal')}</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(createSummary.revisedTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('changeAmt')}</p>
                  <p
                    className={`text-lg font-bold font-mono ${
                      createSummary.changeAmount > 0
                        ? 'text-red-600'
                        : createSummary.changeAmount < 0
                        ? 'text-green-600'
                        : ''
                    }`}
                  >
                    {createSummary.changeAmount > 0 ? '+' : ''}
                    {formatCurrency(createSummary.changeAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('changePercent')}</p>
                  <p
                    className={`text-lg font-bold font-mono ${
                      createSummary.changePercent > 0
                        ? 'text-red-600'
                        : createSummary.changePercent < 0
                        ? 'text-green-600'
                        : ''
                    }`}
                  >
                    {createSummary.changePercent > 0 ? '+' : ''}
                    {formatPercent(createSummary.changePercent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason + Submit */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reason')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="revision-reason">{t('reasonLabel')}</Label>
                <Textarea
                  id="revision-reason"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetCreateForm()
                    setView('list')
                  }}
                >
                  {tc('buttons.cancel')}
                </Button>
                <Button
                  onClick={handleSubmitRevision}
                  disabled={
                    submitting ||
                    !revisionReason.trim() ||
                    revisionLines.every((l) => l.changeAmount === 0)
                  }
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('submitRevision')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )

  // ==================== VIEW: DETAIL ====================

  const renderDetailView = () => {
    if (!selectedRevision) return null

    const rev = selectedRevision
    const pct = Number(rev.changePercent)

    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('revisionNo')}: ${rev.revisionNo}`}
          description={rev.budget?.name || ''}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setView('list')
              setSelectedRevision(null)
              setError(null)
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {renderError()}

        {/* Header info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('revisionDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('status')}</p>
                <div className="mt-1">
                  <StatusBadge status={rev.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('date')}</p>
                <p className="text-sm font-medium">{formatDate(rev.date || rev.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('originalTotal')}</p>
                <p className="text-sm font-mono font-medium">
                  {formatCurrency(Number(rev.originalTotal))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('revisedTotal')}</p>
                <p className="text-sm font-mono font-medium">
                  {formatCurrency(Number(rev.revisedTotal))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('changeAmt')}</p>
                <p
                  className={`text-sm font-mono font-medium ${
                    Number(rev.changeAmount) > 0
                      ? 'text-red-600'
                      : Number(rev.changeAmount) < 0
                      ? 'text-green-600'
                      : ''
                  }`}
                >
                  {Number(rev.changeAmount) > 0 ? '+' : ''}
                  {formatCurrency(Number(rev.changeAmount))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('changePercent')}</p>
                <p
                  className={`text-sm font-mono font-medium ${
                    pct > 0 ? 'text-red-600' : pct < 0 ? 'text-green-600' : ''
                  }`}
                >
                  {pct > 0 ? '+' : ''}
                  {formatPercent(pct)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">{t('reason')}</p>
                <p className="text-sm font-medium">{rev.reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line-by-line changes */}
        {rev.lines && rev.lines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('lineChanges')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('lineDescription')}</TableHead>
                      <TableHead className="text-right">{t('originalAmount')}</TableHead>
                      <TableHead className="text-right">{t('revisedAmount')}</TableHead>
                      <TableHead className="text-right">{t('changeAmt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rev.lines.map((line) => {
                      const chg = Number(line.changeAmount)
                      return (
                        <TableRow key={line.id}>
                          <TableCell className="text-sm">
                            {line.budgetLine?.account
                              ? `${line.budgetLine.account.code} - ${line.budgetLine.account.name}`
                              : line.budgetLine?.description || '\u2014'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(Number(line.originalAmount))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(Number(line.revisedAmount))}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${
                              chg > 0 ? 'text-red-600' : chg < 0 ? 'text-green-600' : ''
                            }`}
                          >
                            {chg > 0 ? '+' : ''}
                            {formatCurrency(chg)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {(rev.status === 'DRAFT' || rev.status === 'SUBMITTED') && (
                <Button
                  onClick={() => handleStatusAction('approve')}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t('approve')}
                </Button>
              )}
              {rev.status === 'SUBMITTED' && (
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('reject')}
                </Button>
              )}
              {rev.status === 'DRAFT' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Switch to create view with pre-loaded data
                      setView('create')
                      setSelectedBudgetId(rev.budgetId)
                      fetchBudgetDetail(rev.budgetId)
                      setRevisionReason(rev.reason)
                      setCreateStep(2)
                    }}
                    disabled={actionLoading}
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    {t('edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete')}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('rejectRevision')}</DialogTitle>
              <DialogDescription>{t('rejectRevisionDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="reject-reason">{t('rejectReasonLabel')}</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('rejectReasonPlaceholder')}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                {tc('buttons.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusAction('reject', rejectReason)}
                disabled={!rejectReason.trim() || actionLoading}
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('confirmReject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('deleteRevision')}</DialogTitle>
              <DialogDescription>{t('deleteRevisionDesc')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                {tc('buttons.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('confirmDelete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  return (
    <>
      {view === 'list' && renderListView()}
      {view === 'create' && renderCreateView()}
      {view === 'detail' && renderDetailView()}
    </>
  )
}
