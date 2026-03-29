'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  RefreshCw, Upload, Download, CheckCircle, AlertCircle, Loader2, Link2, Link2Off, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { HelpButton } from '@/components/shared/help-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface BankAccount {
  id: string
  accountName: string
  bankName: string | null
  accountCode: string
}

interface ReconciliationSummary {
  id: string
  bankAccountId: string
  periodStart: string
  periodEnd: string
  bookBalance: number
  bankBalance: number
  difference: number
  status: string
  createdAt: string
  bankAccount: { accountName: string; bankName: string | null }
}

interface ReconciliationItem {
  id: string
  date: string
  description: string
  reference: string | null
  bookAmount: number | null
  bankAmount: number | null
  isMatched: boolean
  matchedJournalId: string | null
  type: string
}

interface ReconciliationDetail extends ReconciliationSummary {
  items: ReconciliationItem[]
  reconciledAt: string | null
  notes: string | null
}

interface BookEntry {
  id: string
  debit: number
  credit: number
  description: string | null
  journalEntry: {
    id: string
    entryNo: string
    date: string
    description: string
    reference: string | null
  }
}

// ─── Main Page ───

export default function BankReconciliationPage() {
  const t = useTranslations('finance.bankReconciliation')
  const th = useTranslations('finance.help.bankReconciliation')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  // State
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [reconciliations, setReconciliations] = useState<ReconciliationSummary[]>([])
  const [activeRecon, setActiveRecon] = useState<ReconciliationDetail | null>(null)
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([])
  const [loading, setLoading] = useState(true)

  // New reconciliation form
  const [bankAccountId, setBankAccountId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [bankBalance, setBankBalance] = useState('')
  const [starting, setStarting] = useState(false)

  // CSV import dialog
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvDateCol, setCsvDateCol] = useState('0')
  const [csvDescCol, setCsvDescCol] = useState('1')
  const [csvRefCol, setCsvRefCol] = useState('')
  const [csvDebitCol, setCsvDebitCol] = useState('2')
  const [csvCreditCol, setCsvCreditCol] = useState('3')
  const [csvSkipHeader, setCsvSkipHeader] = useState(true)
  const [importing, setImporting] = useState(false)

  // Auto-match
  const [autoMatching, setAutoMatching] = useState(false)

  // Messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ─── Data Fetching ───

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const [baRes, recRes] = await Promise.all([
        fetch('/api/v1/finance/bank-accounts'),
        fetch('/api/v1/finance/bank-reconciliation?limit=50&sort=createdAt&order=desc'),
      ])
      const [baJson, recJson] = await Promise.all([baRes.json(), recRes.json()])
      if (baJson.success) setBankAccounts(baJson.data)
      if (recJson.success) setReconciliations(recJson.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/finance/bank-reconciliation/${id}`)
      const json = await res.json()
      if (json.success) {
        setActiveRecon(json.data)
        // Fetch unmatched book entries for this period
        fetchBookEntries(json.data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  async function fetchBookEntries(recon: ReconciliationDetail) {
    // We don't have a dedicated API for this, so skip for now
    // Book entries are shown from matched items' journalEntry references
    setBookEntries([])
  }

  useEffect(() => { fetchList() }, [fetchList])

  // ─── Actions ───

  async function handleStart() {
    if (!bankAccountId) { setError(t('selectBankAccount')); return }
    if (!periodStart || !periodEnd) { setError(t('periodStart') + ' & ' + t('periodEnd') + ' required'); return }
    if (!bankBalance) { setError(t('bankStatementBalance') + ' required'); return }
    setStarting(true)
    setError('')
    try {
      const res = await fetch('/api/v1/finance/bank-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccountId, periodStart, periodEnd, bankBalance: Number(bankBalance) }),
      })
      const json = await res.json()
      if (json.success) {
        setView('detail')
        await fetchDetail(json.data.id)
        setBankAccountId('')
        setPeriodStart('')
        setPeriodEnd('')
        setBankBalance('')
      } else {
        setError(json.error?.message || 'Failed')
      }
    } catch {
      setError('Network error')
    }
    setStarting(false)
  }

  async function handleCsvImport() {
    if (!csvFile || !activeRecon) return
    setImporting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('dateCol', csvDateCol)
      formData.append('descCol', csvDescCol)
      if (csvRefCol) formData.append('refCol', csvRefCol)
      formData.append('debitCol', csvDebitCol)
      formData.append('creditCol', csvCreditCol)
      formData.append('skipHeader', csvSkipHeader ? 'true' : 'false')

      const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeRecon.id}/import`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(t('importSuccess', { count: String(json.data.imported) }))
        setCsvOpen(false)
        setCsvFile(null)
        await fetchDetail(activeRecon.id)
      } else {
        setError(json.error?.message || 'Import failed')
      }
    } catch {
      setError('Import failed')
    }
    setImporting(false)
  }

  async function handleAutoMatch() {
    if (!activeRecon) return
    setAutoMatching(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeRecon.id}/auto-match`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(t('matchedCount', { count: String(json.data.matched) }))
        await fetchDetail(activeRecon.id)
      }
    } catch { /* ignore */ }
    setAutoMatching(false)
  }

  async function handleUnmatch(itemId: string) {
    if (!activeRecon) return
    try {
      // Update item to unmatched via the match endpoint
      const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeRecon.id}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ date: new Date().toISOString(), description: 'unmatch', type: 'unmatch' }],
        }),
      })
      // For now, just refetch — proper unmatch would need a PATCH endpoint
      await fetchDetail(activeRecon.id)
    } catch { /* ignore */ }
  }

  async function handleFinalize() {
    if (!activeRecon) return
    const diff = Number(activeRecon.difference)
    if (Math.abs(diff) > 0.01) {
      setError(t('differenceNotZero', { amount: formatCurrency(diff) }))
      return
    }
    try {
      const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeRecon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECONCILED' }),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(t('reconciled'))
        await fetchDetail(activeRecon.id)
      }
    } catch { /* ignore */ }
  }

  function openDetail(id: string) {
    setView('detail')
    setError('')
    setSuccess('')
    fetchDetail(id)
  }

  function backToList() {
    setView('list')
    setActiveRecon(null)
    setError('')
    setSuccess('')
    fetchList()
  }

  // Clear messages after 5s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const isReconciled = activeRecon?.status === 'RECONCILED'

  // ─── Detail View ───
  if (view === 'detail') {
    if (loading || !activeRecon) {
      return (
        <div className="space-y-6">
          <PageHeader title={t('title')} description="" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Card key={i}><CardContent className="py-8"><Skeleton className="h-8 w-48" /></CardContent></Card>)}
          </div>
        </div>
      )
    }

    const matchedItems = activeRecon.items.filter(i => i.isMatched)
    const unmatchedItems = activeRecon.items.filter(i => !i.isMatched)

    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('title')} — ${activeRecon.bankAccount.accountName}`}
          description={`${new Date(activeRecon.periodStart).toLocaleDateString()} → ${new Date(activeRecon.periodEnd).toLocaleDateString()}`}
        >
          <Button variant="outline" size="sm" onClick={backToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">{success}</div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('bookBalance')}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-mono">{formatCurrency(Number(activeRecon.bookBalance))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('statementBalance')}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-mono">{formatCurrency(Number(activeRecon.bankBalance))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('difference')}</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold font-mono ${Math.abs(Number(activeRecon.difference)) < 0.01 ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatCurrency(Number(activeRecon.difference))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('status')}</CardTitle></CardHeader>
            <CardContent>
              <Badge variant={isReconciled ? 'default' : 'outline'} className="text-base px-3 py-1">
                {isReconciled ? <><CheckCircle className="h-4 w-4 mr-1.5" />{t('reconciled')}</> : t('pending')}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        {!isReconciled && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />{t('importCsv')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAutoMatch} disabled={autoMatching || activeRecon.items.length === 0}>
              {autoMatching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {autoMatching ? t('autoMatching') : t('autoMatch')}
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleFinalize} disabled={Math.abs(Number(activeRecon.difference)) > 0.01}>
              <CheckCircle className="h-4 w-4 mr-2" />{t('finalize')}
            </Button>
          </div>
        )}

        {/* Bank Statement Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('bankStatementLines')}
              <span className="text-muted-foreground font-normal ml-2">
                ({matchedItems.length} {t('matched')}, {unmatchedItems.length} {t('unmatched')})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRecon.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t('noItems')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('descriptionRef')}</TableHead>
                      <TableHead>{t('type')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                      <TableHead className="text-center">{t('matchStatus')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRecon.items.map(item => (
                      <TableRow key={item.id} className={item.isMatched ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}>
                        <TableCell className="text-sm">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="text-sm">{item.description}</div>
                          {item.reference && <div className="text-xs text-muted-foreground">{item.reference}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'DEPOSIT' ? 'default' : 'outline'} className="text-xs">
                            {item.type === 'DEPOSIT' ? t('deposit') : t('withdrawal')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(item.bankAmount || 0))}</TableCell>
                        <TableCell className="text-center">
                          {item.isMatched ? (
                            <div className="flex items-center justify-center gap-1">
                              <Link2 className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs text-emerald-600">{t('matched')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Link2Off className="h-4 w-4 text-destructive" />
                              <span className="text-xs text-destructive font-medium">{t('unmatched')}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unmatched items help note */}
        {!isReconciled && unmatchedItems.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t('unmatchedHelpTitle', { count: String(unmatchedItems.length) })}
                </p>
                <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">{t('unmatchedHelpDesc')}</p>
                <ul className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-2 space-y-1 list-disc list-inside">
                  <li>{t('unmatchedStep1')}</li>
                  <li>{t('unmatchedStep2')}</li>
                  <li>{t('unmatchedStep3')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Dialog */}
        <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>{t('csvImport')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
              {/* Sample Format */}
              <div className="rounded-lg bg-muted/50 border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{t('csvSampleFormat')}</p>
                  <a href="/sample-bank-statement.csv" download className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium hover:bg-primary/20 transition-colors">
                    <Download className="h-3 w-3" />{t('downloadSample')}
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-[11px] font-mono w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-3 text-muted-foreground">Col 0: Date</th>
                        <th className="text-left py-1 pr-3 text-muted-foreground">Col 1: Description</th>
                        <th className="text-right py-1 pr-3 text-muted-foreground">Col 2: Debit</th>
                        <th className="text-right py-1 text-muted-foreground">Col 3: Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="py-0.5 pr-3">05/03/2026</td><td className="pr-3">Fund Transfer USAID</td><td className="text-right pr-3"></td><td className="text-right">500,000</td></tr>
                      <tr><td className="py-0.5 pr-3">10/03/2026</td><td className="pr-3">Cheque Payment CHQ-4521</td><td className="text-right pr-3">185,000</td><td className="text-right"></td></tr>
                      <tr><td className="py-0.5 pr-3">15/03/2026</td><td className="pr-3">Bank Service Charge</td><td className="text-right pr-3">2,500</td><td className="text-right"></td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground">{t('csvSampleHint')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('csvFile')}</Label>
                <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
              </div>

              <p className="text-xs font-medium text-muted-foreground">{t('columnMapping')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('dateColumn')}</Label>
                  <Input value={csvDateCol} onChange={e => setCsvDateCol(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('descColumn')}</Label>
                  <Input value={csvDescCol} onChange={e => setCsvDescCol(e.target.value)} placeholder="1" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('debitColumn')}</Label>
                  <Input value={csvDebitCol} onChange={e => setCsvDebitCol(e.target.value)} placeholder="2" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('creditColumn')}</Label>
                  <Input value={csvCreditCol} onChange={e => setCsvCreditCol(e.target.value)} placeholder="3" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('refColumn')}</Label>
                  <Input value={csvRefCol} onChange={e => setCsvRefCol(e.target.value)} placeholder={t('refColumnHint')} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={csvSkipHeader} onCheckedChange={setCsvSkipHeader} id="skip-header" />
                  <Label htmlFor="skip-header" className="text-xs">{t('skipHeader')}</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0">
              <Button variant="outline" onClick={() => setCsvOpen(false)}>{tc('buttons.cancel')}</Button>
              <Button onClick={handleCsvImport} disabled={!csvFile || importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {importing ? t('importing') : t('import')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── List View ───
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={th('title')}
          description={th('description')}
          steps={[
            { title: th('step1Title'), description: th('step1Desc') },
            { title: th('step2Title'), description: th('step2Desc') },
            { title: th('step3Title'), description: th('step3Desc') },
            { title: th('step4Title'), description: th('step4Desc') },
            { title: th('step5Title'), description: th('step5Desc') },
          ]}
          tips={[th('tip1'), th('tip2'), th('tip3')]}
          example={{
            title: th('exampleTitle'),
            lines: [th('exampleLine1'), th('exampleLine2'), th('exampleLine3'), th('exampleLine4'), th('exampleLine5')],
          }}
        />
      </PageHeader>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* New Reconciliation Form */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('startReconciliation')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('bankAccount')}</Label>
              <Select value={bankAccountId} onValueChange={(v) => { setBankAccountId(v); setError('') }}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t('selectBankAccount')} /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(ba => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.accountName}{ba.bankName ? ` — ${ba.bankName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label>{t('periodStart')}</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('periodEnd')}</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bankStatementBalance')}</Label>
                <Input type="number" step="0.01" value={bankBalance} onChange={e => setBankBalance(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleStart} disabled={starting} className="h-9">
                {starting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {starting ? t('starting') : t('startReconciliation')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation History */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('reconciliationList')}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reconciliations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t('noReconciliations')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bankAccount')}</TableHead>
                    <TableHead>{t('period')}</TableHead>
                    <TableHead className="text-right">{t('bookBalance')}</TableHead>
                    <TableHead className="text-right">{t('statementBalance')}</TableHead>
                    <TableHead className="text-right">{t('difference')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('createdAt')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map(rec => (
                    <TableRow key={rec.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(rec.id)}>
                      <TableCell className="font-medium text-sm">{rec.bankAccount.accountName}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(rec.periodStart).toLocaleDateString()} — {new Date(rec.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(rec.bookBalance))}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(rec.bankBalance))}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${Math.abs(Number(rec.difference)) < 0.01 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatCurrency(Number(rec.difference))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rec.status === 'RECONCILED' ? 'default' : 'outline'}>
                          {rec.status === 'RECONCILED' ? t('reconciled') : t('pending')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(rec.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(rec.id) }}>
                          {t('viewReconciliation')}
                        </Button>
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
