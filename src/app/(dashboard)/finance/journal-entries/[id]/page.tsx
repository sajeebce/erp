'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/shared/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  TableFooter,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useFormatters } from '@/hooks/use-formatters'
import { cn } from '@/lib/utils'

interface JournalLine {
  id: string
  accountId: string
  description: string
  debit: number
  credit: number
  account?: {
    id: string
    code: string
    name: string
  }
}

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  reference: string | null
  status: string
  fiscalYearId: string | null
  projectId: string | null
  grantId: string | null
  currencyCode: string
  notes: string | null
  totalDebit: number | string
  totalCredit: number | string
  lines: JournalLine[]
  project?: { id: string; name: string; code?: string } | null
  grant?: { id: string; name: string; code?: string } | null
  fiscalYear?: { id: string; name: string } | null
  createdBy?: { name: string; email: string } | null
  approvedBy?: { name: string; email: string } | null
  createdAt: string
  updatedAt: string
}

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface FiscalYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent?: boolean
}

interface Project {
  id: string
  name: string
  code?: string
}

interface Grant {
  id: string
  name: string
  code?: string
}

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP']

function createEmptyLine(): JournalLine {
  return {
    id: crypto.randomUUID(),
    accountId: '',
    description: '',
    debit: 0,
    credit: 0,
  }
}

export default function JournalEntryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const entryId = params.id as string
  const t = useTranslations('finance.journalEntries')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  // Data
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit mode
  const [editing, setEditing] = useState(false)

  // Edit form state
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([])

  // Reference data (for edit mode)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [grants, setGrants] = useState<Grant[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch entry data
  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/finance/journal-entries/${entryId}`)
        const json = await res.json()
        if (res.ok && json.success) {
          setEntry(json.data)
        } else {
          setError(t('failedToLoad'))
        }
      } catch {
        setError(t('failedToLoad'))
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [entryId, t])

  // Fetch reference data when entering edit mode
  useEffect(() => {
    if (!editing) return

    const fetchRefData = async () => {
      try {
        const [accountsRes, fyRes, projRes, grantsRes] = await Promise.all([
          fetch('/api/v1/finance/accounts?isGroup=false&limit=500'),
          fetch('/api/v1/settings/fiscal-years'),
          fetch('/api/v1/projects?limit=100'),
          fetch('/api/v1/donors/grants?limit=100'),
        ])

        const [accountsJson, fyJson, projJson, grantsJson] = await Promise.all([
          accountsRes.json(),
          fyRes.json(),
          projRes.json(),
          grantsRes.json(),
        ])

        if (accountsJson.success) setAccounts(accountsJson.data)
        if (fyJson.success) setFiscalYears(fyJson.data)
        if (projJson.success) setProjects(projJson.data)
        if (grantsJson.success) setGrants(grantsJson.data)
      } catch {
        // Reference data fetch errors are non-critical
      }
    }

    fetchRefData()
  }, [editing])

  // Populate edit form when entering edit mode
  const enterEditMode = useCallback(() => {
    if (!entry) return
    setDate(entry.date.split('T')[0])
    setDescription(entry.description)
    setReference(entry.reference || '')
    setFiscalYearId(entry.fiscalYearId || '')
    setProjectId(entry.projectId || '')
    setGrantId(entry.grantId || '')
    setCurrencyCode(entry.currencyCode || 'BDT')
    setNotes(entry.notes || '')
    setLines(
      entry.lines.map((line) => ({
        id: line.id || crypto.randomUUID(),
        accountId: line.accountId || line.account?.id || '',
        description: line.description || '',
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }))
    )
    setEditing(true)
    setError('')
  }, [entry])

  const cancelEdit = useCallback(() => {
    setEditing(false)
    setError('')
  }, [])

  // Edit-mode calculations
  const totalDebit = useMemo(
    () => lines.reduce((sum, line) => sum + (line.debit || 0), 0),
    [lines]
  )
  const totalCredit = useMemo(
    () => lines.reduce((sum, line) => sum + (line.credit || 0), 0),
    [lines]
  )
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit
  const difference = Math.abs(totalDebit - totalCredit)

  // Line handlers
  const updateLine = useCallback(
    (id: string, field: keyof JournalLine, value: string | number) => {
      setLines((prev) =>
        prev.map((line) => {
          if (line.id !== id) return line
          const updated = { ...line, [field]: value }
          if (field === 'debit' && Number(value) > 0) {
            updated.credit = 0
          } else if (field === 'credit' && Number(value) > 0) {
            updated.debit = 0
          }
          return updated
        })
      )
    },
    []
  )

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback(
    (id: string) => {
      if (lines.length <= 2) return
      setLines((prev) => prev.filter((line) => line.id !== id))
    },
    [lines.length]
  )

  // Save edited entry
  const handleSave = async () => {
    setError('')

    if (!description.trim()) {
      setError(t('descriptionRequired'))
      return
    }
    if (lines.length < 2) {
      setError(t('minTwoLines'))
      return
    }
    if (!isBalanced) {
      setError(t('mustBalance'))
      return
    }
    const hasEmptyAccounts = lines.some((line) => !line.accountId)
    if (hasEmptyAccounts) {
      setError(t('selectAccount'))
      return
    }

    setSaving(true)

    try {
      const payload = {
        date,
        description: description.trim(),
        reference: reference.trim() || undefined,
        fiscalYearId: fiscalYearId || undefined,
        projectId: projectId || undefined,
        grantId: grantId || undefined,
        currencyCode,
        notes: notes.trim() || undefined,
        lines: lines.map((line) => ({
          accountId: line.accountId,
          description: line.description.trim(),
          debit: line.debit || 0,
          credit: line.credit || 0,
        })),
      }

      const res = await fetch(`/api/v1/finance/journal-entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        setEntry(json.data)
        setEditing(false)
      } else {
        setError(json.message || t('failedToSave'))
      }
    } catch {
      setError(t('failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  // Post entry
  const handlePost = async () => {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/v1/finance/journal-entries/${entryId}/post`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (res.ok && json.success) {
        setEntry((prev) => (prev ? { ...prev, status: 'APPROVED' } : prev))
      } else {
        setError(json.message || t('failedToPost'))
      }
    } catch {
      setError(t('failedToPost'))
    } finally {
      setActionLoading(false)
    }
  }

  // Delete entry
  const handleDelete = async () => {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/finance/journal-entries/${entryId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/finance/journal-entries')
      } else {
        setError(json.message || t('failedToDelete'))
      }
    } catch {
      setError(t('failedToDelete'))
    } finally {
      setActionLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{tc('labels.loading')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (no entry)
  if (!entry) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground">
              {error || tc('errors.notFound')}
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc('buttons.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isDraft = entry.status === 'DRAFT'
  const viewDebit = Number(entry.totalDebit) || 0
  const viewCredit = Number(entry.totalCredit) || 0

  // ---- EDIT MODE ----
  if (editing) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('editEntry')} description={entry.entryNo}>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={cancelEdit}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !isBalanced}>
              {saving ? t('savingEntry') : tc('buttons.save')}
            </Button>
          </div>
        </PageHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Header fields */}
        <Card>
          <CardHeader>
            <CardTitle>{t('entryDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-date">{t('date')}</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="edit-description">
                  {t('narration')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reference">{t('reference')}</Label>
                <Input
                  id="edit-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fiscalYear">{t('fiscalYear')}</Label>
                <Select value={fiscalYearId} onValueChange={setFiscalYearId}>
                  <SelectTrigger id="edit-fiscalYear">
                    <SelectValue placeholder={t('selectFiscalYear')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map((fy) => (
                      <SelectItem key={fy.id} value={fy.id}>
                        {fy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currency">{t('currency')}</Label>
                <Select value={currencyCode} onValueChange={setCurrencyCode}>
                  <SelectTrigger id="edit-currency">
                    <SelectValue placeholder={t('selectCurrency')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project">{t('project')}</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="edit-project">
                    <SelectValue placeholder={t('selectProject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `${p.code} - ${p.name}` : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-grant">{t('grant')}</Label>
                <Select value={grantId} onValueChange={setGrantId}>
                  <SelectTrigger id="edit-grant">
                    <SelectValue placeholder={t('selectGrant')} />
                  </SelectTrigger>
                  <SelectContent>
                    {grants.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.code ? `${g.code} - ${g.name}` : g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="edit-notes">{t('notes')}</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable lines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('lines')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addLine')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">{t('account')}</TableHead>
                    <TableHead className="min-w-[180px]">{t('lineDescription')}</TableHead>
                    <TableHead className="min-w-[140px] text-right">{t('debit')}</TableHead>
                    <TableHead className="min-w-[140px] text-right">{t('credit')}</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select
                          value={line.accountId}
                          onValueChange={(val) =>
                            updateLine(line.id, 'accountId', val)
                          }
                        >
                          <SelectTrigger aria-label={t('selectAccount')}>
                            <SelectValue placeholder={t('selectAccount')} />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, 'description', e.target.value)
                          }
                          placeholder={t('lineDescription')}
                          aria-label={t('lineDescription')}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.debit || ''}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              'debit',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="text-right font-mono"
                          placeholder="0.00"
                          aria-label={t('debit')}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.credit || ''}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              'credit',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="text-right font-mono"
                          placeholder="0.00"
                          aria-label={t('credit')}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 2}
                          aria-label={t('removeLine')}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow
                    className={cn(
                      'font-semibold',
                      !isBalanced && totalDebit + totalCredit > 0
                        ? 'bg-destructive/10'
                        : ''
                    )}
                  >
                    <TableCell colSpan={2} className="text-right">
                      {tc('labels.total')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totalDebit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totalCredit)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Balance indicator */}
            <div className="mt-4 flex items-center justify-end gap-4">
              {totalDebit + totalCredit > 0 && (
                <>
                  {!isBalanced && (
                    <span className="text-sm text-muted-foreground">
                      {t('difference')}: {formatCurrency(difference)}
                    </span>
                  )}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                      isBalanced
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {isBalanced ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {t('balanced')}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        {t('unbalanced')}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attachments (edit mode) */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload entityType="journal_entry" entityId={entry.id} module="finance" />
          </CardContent>
        </Card>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end gap-2 pb-6">
          <Button variant="outline" onClick={cancelEdit}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !isBalanced}>
            {saving ? t('savingEntry') : tc('buttons.save')}
          </Button>
        </div>
      </div>
    )
  }

  // ---- VIEW MODE ----
  return (
    <div className="space-y-6">
      <PageHeader title={`${t('entryNo')}: ${entry.entryNo}`}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/finance/journal-entries')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tc('buttons.back')}
          </Button>
          {isDraft && (
            <>
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Pencil className="mr-2 h-4 w-4" />
                {tc('buttons.edit')}
              </Button>

              <ConfirmDialog
                trigger={
                  <Button size="sm" disabled={actionLoading}>
                    {t('postEntry')}
                  </Button>
                }
                title={t('confirmPost')}
                description={t('confirmPostDesc')}
                confirmText={t('postEntry')}
                variant="default"
                onConfirm={handlePost}
              />

              <ConfirmDialog
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading}
                  >
                    {tc('buttons.delete')}
                  </Button>
                }
                title={t('confirmDelete')}
                description={t('confirmDeleteDesc')}
                onConfirm={handleDelete}
              />
            </>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Entry header info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('entryDetails')}</CardTitle>
            <StatusBadge status={entry.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('entryNo')}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {entry.entryNo}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('date')}
              </dt>
              <dd className="mt-1 text-sm">{formatDate(entry.date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('narration')}
              </dt>
              <dd className="mt-1 text-sm">{entry.description}</dd>
            </div>
            {entry.reference && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('reference')}
                </dt>
                <dd className="mt-1 text-sm">{entry.reference}</dd>
              </div>
            )}
            {entry.fiscalYear && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('fiscalYear')}
                </dt>
                <dd className="mt-1 text-sm">{entry.fiscalYear.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('currency')}
              </dt>
              <dd className="mt-1 text-sm">{entry.currencyCode}</dd>
            </div>
            {entry.project && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('project')}
                </dt>
                <dd className="mt-1 text-sm">
                  {entry.project.code
                    ? `${entry.project.code} - ${entry.project.name}`
                    : entry.project.name}
                </dd>
              </div>
            )}
            {entry.grant && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('grant')}
                </dt>
                <dd className="mt-1 text-sm">
                  {entry.grant.code
                    ? `${entry.grant.code} - ${entry.grant.name}`
                    : entry.grant.name}
                </dd>
              </div>
            )}
            {entry.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('notes')}
                </dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">
                  {entry.notes}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Journal lines (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('lines')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('accountCode')}</TableHead>
                  <TableHead>{t('accountName')}</TableHead>
                  <TableHead>{t('lineDescription')}</TableHead>
                  <TableHead className="text-right">{t('debit')}</TableHead>
                  <TableHead className="text-right">{t('credit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell className="font-mono text-sm">
                      {line.account?.code || '\u2014'}
                    </TableCell>
                    <TableCell>{line.account?.name || '\u2014'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.description || '\u2014'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(line.debit) > 0
                        ? formatCurrency(Number(line.debit))
                        : '\u2014'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(line.credit) > 0
                        ? formatCurrency(Number(line.credit))
                        : '\u2014'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="font-semibold">
                  <TableCell colSpan={3} className="text-right">
                    {tc('labels.total')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(viewDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(viewCredit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attachments (view mode) */}
      <Card>
        <CardContent className="pt-6">
          <FileUpload entityType="journal_entry" entityId={entry.id} module="finance" readOnly={!isDraft} />
        </CardContent>
      </Card>

      {/* Audit info */}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entry.createdBy && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('createdBy')}
                </dt>
                <dd className="mt-1 text-sm">{entry.createdBy.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('createdAt')}
              </dt>
              <dd className="mt-1 text-sm">{formatDate(entry.createdAt)}</dd>
            </div>
            {entry.approvedBy && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('approvedBy')}
                </dt>
                <dd className="mt-1 text-sm">{entry.approvedBy.name}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
