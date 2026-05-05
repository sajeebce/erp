'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  DimensionSelector,
  type DimensionValue,
} from '@/components/finance/dimension-selector'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'
import { cn } from '@/lib/utils'

interface JournalLine {
  id: string
  accountId: string
  description: string
  debit: number
  credit: number
  dimensions: DimensionValue
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

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP']

function emptyDimensions(): DimensionValue {
  return {
    businessUnitId: null,
    costCenterId: null,
    fundClassId: null,
    projectId: null,
    grantId: null,
  }
}

function createEmptyLine(): JournalLine {
  return {
    id: crypto.randomUUID(),
    accountId: '',
    description: '',
    debit: 0,
    credit: 0,
    dimensions: emptyDimensions(),
  }
}

function dimensionsAreEmpty(d: DimensionValue) {
  return !d.businessUnitId && !d.costCenterId && !d.fundClassId && !d.projectId && !d.grantId
}

export default function NewJournalEntryPage() {
  const router = useRouter()
  const t = useTranslations('finance.journalEntries')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [headerDimensions, setHeaderDimensions] = useState<DimensionValue>(emptyDimensions())
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    createEmptyLine(),
    createEmptyLine(),
  ])
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, fiscalYearsRes, orgRes] = await Promise.all([
          fetch('/api/v1/finance/accounts?isGroup=false&limit=500'),
          fetch('/api/v1/settings/fiscal-years'),
          fetch('/api/v1/settings/organization'),
        ])

        const [accountsJson, fyJson, orgJson] = await Promise.all([
          accountsRes.json(),
          fiscalYearsRes.json(),
          orgRes.json(),
        ])

        if (accountsJson.success) setAccounts(accountsJson.data)
        if (fyJson.success) {
          setFiscalYears(fyJson.data)
          const current = fyJson.data.find((fy: FiscalYear) => fy.isCurrent)
          if (current) setFiscalYearId(current.id)
        }
        if (orgJson.success && orgJson.data.baseCurrency) {
          setCurrencyCode(orgJson.data.baseCurrency)
        }
      } catch {
        // Silently handle fetch errors for reference data
      }
    }

    fetchData()
  }, [])

  // Calculations
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
          // Enforce: only one of debit/credit can be > 0
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

  const updateLineDimensions = useCallback((id: string, next: DimensionValue) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, dimensions: next } : line)))
  }, [])

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

  // Effective per-line dimensions = line override OR header default. Used for both display
  // and submit payload. The user sees inheritance visually via the "header default" hint.
  const effectiveDimensions = useCallback(
    (line: JournalLine): DimensionValue => {
      const d = line.dimensions
      return {
        businessUnitId: d.businessUnitId ?? headerDimensions.businessUnitId ?? null,
        costCenterId: d.costCenterId ?? null, // CC never inherits to avoid mismatch with line BU
        fundClassId: d.fundClassId ?? headerDimensions.fundClassId ?? null,
        projectId: d.projectId ?? headerDimensions.projectId ?? null,
        grantId: d.grantId ?? headerDimensions.grantId ?? null,
      }
    },
    [headerDimensions],
  )

  // Submit
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

    // Client-side hint: if any line has CC set, BU must be set on that line OR header.
    const dimError = lines.find((line) => {
      const eff = effectiveDimensions(line)
      return eff.costCenterId && !eff.businessUnitId
    })
    if (dimError) {
      setError('A line has a Cost Center but no Business Unit (set BU on the line or as a header default).')
      return
    }

    setSaving(true)

    try {
      const payload = {
        date,
        description: description.trim(),
        reference: reference.trim() || undefined,
        fiscalYearId: fiscalYearId || undefined,
        // Header-level dimensions (JE table only stores businessUnitId/projectId/grantId at header)
        businessUnitId: headerDimensions.businessUnitId || undefined,
        projectId: headerDimensions.projectId || undefined,
        grantId: headerDimensions.grantId || undefined,
        currencyCode,
        notes: notes.trim() || undefined,
        lines: lines.map((line) => {
          const eff = effectiveDimensions(line)
          return {
            accountId: line.accountId,
            description: line.description.trim(),
            debit: line.debit || 0,
            credit: line.credit || 0,
            businessUnitId: eff.businessUnitId || undefined,
            costCenterId: eff.costCenterId || undefined,
            fundClassId: eff.fundClassId || undefined,
            projectId: eff.projectId || undefined,
          }
        }),
      }

      const res = await fetch('/api/v1/finance/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        router.push(`/finance/journal-entries/${json.data.id}`)
      } else {
        setError(json.error?.message || json.message || t('failedToSave'))
      }
    } catch {
      setError(t('failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('createEntry')} description={t('description')}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !isBalanced}>
            {saving ? t('savingEntry') : t('saveAsDraft')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('entryDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">{t('date')}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="description">
                {t('narration')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('narration')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">{t('reference')}</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t('reference')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">{t('fiscalYear')}</Label>
              <SearchableSelect
                id="fiscalYear"
                options={fiscalYears.map((fy) => ({ value: fy.id, label: fy.name }))}
                value={fiscalYearId}
                onValueChange={setFiscalYearId}
                placeholder={t('selectFiscalYear')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('currency')}</Label>
              <SearchableSelect
                id="currency"
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                value={currencyCode}
                onValueChange={setCurrencyCode}
                placeholder={t('selectCurrency')}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-medium">Default dimensions</Label>
              <span className="text-xs text-muted-foreground">
                Lines inherit these unless overridden
              </span>
            </div>
            <DimensionSelector
              level="header"
              value={headerDimensions}
              onChange={setHeaderDimensions}
              idPrefix="je-header"
            />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notes')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines Section — card-per-row layout */}
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
        <CardContent className="space-y-3">
          {lines.map((line, idx) => {
            const eff = effectiveDimensions(line)
            const usingHeaderBu = !line.dimensions.businessUnitId && !!headerDimensions.businessUnitId
            const usingHeaderFc = !line.dimensions.fundClassId && !!headerDimensions.fundClassId
            const isEditing = editingLineId === line.id
            return (
              <div key={line.id} className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Line {idx + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 2}
                    aria-label={t('removeLine')}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`account-${line.id}`}>{t('account')}</Label>
                    <SearchableSelect
                      id={`account-${line.id}`}
                      options={accounts.map((acc) => ({
                        value: acc.id,
                        label: `${acc.code} - ${acc.name}`,
                      }))}
                      value={line.accountId}
                      onValueChange={(val) => updateLine(line.id, 'accountId', val)}
                      placeholder={t('selectAccount')}
                      searchPlaceholder="Search accounts…"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`desc-${line.id}`}>{t('lineDescription')}</Label>
                    <Input
                      id={`desc-${line.id}`}
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder={t('lineDescription')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`debit-${line.id}`}>{t('debit')}</Label>
                    <Input
                      id={`debit-${line.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                      className="text-right font-mono tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`credit-${line.id}`}>{t('credit')}</Label>
                    <Input
                      id={`credit-${line.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                      className="text-right font-mono tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Line amount</Label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 font-mono text-sm tabular-nums">
                      {formatCurrency((line.debit || 0) + (line.credit || 0))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <Label className="text-sm">Dimensions</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {dimensionsAreEmpty(line.dimensions)
                          ? usingHeaderBu || usingHeaderFc
                            ? `inherits ${[usingHeaderBu && 'BU', usingHeaderFc && 'FC'].filter(Boolean).join(' + ')} from header`
                            : 'no overrides'
                          : 'overridden on this line'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setEditingLineId(isEditing ? null : line.id)}
                      >
                        {isEditing ? 'Hide' : 'Edit'}
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <DimensionSelector
                      level="line"
                      value={line.dimensions}
                      onChange={(next) => updateLineDimensions(line.id, next)}
                      idPrefix={`je-line-${idx}`}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {[
                        eff.businessUnitId && { key: 'BU', value: eff.businessUnitId, isHeader: !line.dimensions.businessUnitId },
                        eff.costCenterId && { key: 'CC', value: eff.costCenterId, isHeader: false },
                        eff.fundClassId && { key: 'FC', value: eff.fundClassId, isHeader: !line.dimensions.fundClassId },
                        eff.projectId && { key: 'PR', value: eff.projectId, isHeader: !line.dimensions.projectId },
                        eff.grantId && { key: 'GR', value: eff.grantId, isHeader: !line.dimensions.grantId },
                      ]
                        .filter((tag): tag is { key: string; value: string; isHeader: boolean } => Boolean(tag))
                        .map((tag) => (
                          <span
                            key={tag.key}
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]',
                              tag.isHeader
                                ? 'bg-muted/40 text-muted-foreground'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                            )}
                          >
                            <span className="text-[9px] font-semibold uppercase tracking-wide">{tag.key}</span>
                            {tag.isHeader ? '(from header)' : 'set'}
                          </span>
                        ))}
                      {dimensionsAreEmpty(line.dimensions) &&
                        !headerDimensions.businessUnitId &&
                        !headerDimensions.fundClassId &&
                        !headerDimensions.projectId &&
                        !headerDimensions.grantId && (
                          <span className="text-[11px] text-muted-foreground italic">No dimensions</span>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div
            className={cn(
              'rounded-lg border-2 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
              !isBalanced && totalDebit + totalCredit > 0 ? 'border-destructive/40 bg-destructive/5' : 'border-muted',
            )}
          >
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">{t('debit')}</div>
                <div className="font-mono font-semibold tabular-nums">{formatCurrency(totalDebit)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('credit')}</div>
                <div className="font-mono font-semibold tabular-nums">{formatCurrency(totalCredit)}</div>
              </div>
            </div>
            {totalDebit + totalCredit > 0 && (
              <div className="flex items-center gap-3">
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
                      : 'bg-destructive/10 text-destructive',
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('attachments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload entityType="journal_entry" entityId={null} module="finance" />
        </CardContent>
      </Card>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-2 pb-6">
        <Button variant="outline" onClick={() => router.back()}>
          {tc('buttons.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving || !isBalanced}>
          {saving ? t('savingEntry') : t('saveAsDraft')}
        </Button>
      </div>
    </div>
  )
}
