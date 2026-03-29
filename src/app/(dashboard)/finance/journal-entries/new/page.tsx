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
import { useFormatters } from '@/hooks/use-formatters'
import { cn } from '@/lib/utils'

interface JournalLine {
  id: string
  accountId: string
  description: string
  debit: number
  credit: number
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
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    createEmptyLine(),
    createEmptyLine(),
  ])

  // Reference data
  const [accounts, setAccounts] = useState<Account[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [grants, setGrants] = useState<Grant[]>([])

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch reference data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, fiscalYearsRes, projectsRes, grantsRes, orgRes] =
          await Promise.all([
            fetch('/api/v1/finance/accounts?isGroup=false&limit=500'),
            fetch('/api/v1/settings/fiscal-years'),
            fetch('/api/v1/projects?limit=100'),
            fetch('/api/v1/donors/grants?limit=100'),
            fetch('/api/v1/settings/organization'),
          ])

        const [accountsJson, fyJson, projJson, grantsJson, orgJson] = await Promise.all([
          accountsRes.json(),
          fiscalYearsRes.json(),
          projectsRes.json(),
          grantsRes.json(),
          orgRes.json(),
        ])

        if (accountsJson.success) setAccounts(accountsJson.data)
        if (fyJson.success) {
          setFiscalYears(fyJson.data)
          const current = fyJson.data.find((fy: FiscalYear) => fy.isCurrent)
          if (current) setFiscalYearId(current.id)
        }
        if (projJson.success) setProjects(projJson.data)
        if (grantsJson.success) setGrants(grantsJson.data)
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

      const res = await fetch('/api/v1/finance/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        router.push(`/finance/journal-entries/${json.data.id}`)
      } else {
        setError(json.message || t('failedToSave'))
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
        <CardContent>
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
              <Select value={fiscalYearId} onValueChange={setFiscalYearId}>
                <SelectTrigger id="fiscalYear">
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
              <Label htmlFor="currency">{t('currency')}</Label>
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger id="currency">
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
              <Label htmlFor="project">{t('project')}</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v === '_none' ? '' : v)}>
                <SelectTrigger id="project">
                  <SelectValue placeholder={t('selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-muted-foreground">{t('noProject')}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ${p.name}` : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant">{t('grant')}</Label>
              <Select value={grantId} onValueChange={(v) => setGrantId(v === '_none' ? '' : v)}>
                <SelectTrigger id="grant">
                  <SelectValue placeholder={t('selectGrant')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-muted-foreground">{t('noGrant')}</SelectItem>
                  {grants.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.code ? `${g.code} - ${g.name}` : g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notes')}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lines Section */}
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
