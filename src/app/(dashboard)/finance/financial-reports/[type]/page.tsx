'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { ReportViewer } from '@/components/shared/report-viewer'

interface FiscalYear {
  id: string
  name: string
  isCurrent: boolean
  startDate: string
  endDate: string
}

// Column definitions per report type
function getColumns(type: string, t: (key: string) => string) {
  const currency = { align: 'right' as const, format: 'currency' as const }

  switch (type) {
    case 'trial-balance':
      return [
        { key: 'accountCode', label: t('code'), align: 'left' as const, format: 'text' as const },
        { key: 'accountName', label: t('account'), align: 'left' as const, format: 'text' as const },
        { key: 'periodDebit', label: t('periodDebit'), ...currency },
        { key: 'periodCredit', label: t('periodCredit'), ...currency },
        { key: 'closingDebit', label: t('closingDebit'), ...currency },
        { key: 'closingCredit', label: t('closingCredit'), ...currency },
      ]
    case 'income-statement':
    case 'receipts-payments':
      return [
        { key: 'accountCode', label: t('code'), align: 'left' as const, format: 'text' as const },
        { key: 'accountName', label: t('account'), align: 'left' as const, format: 'text' as const },
        { key: 'amount', label: t('amount'), ...currency },
      ]
    case 'balance-sheet':
      return [
        { key: 'accountCode', label: t('code'), align: 'left' as const, format: 'text' as const },
        { key: 'accountName', label: t('account'), align: 'left' as const, format: 'text' as const },
        { key: 'balance', label: t('balance'), ...currency },
      ]
    case 'ledger-summary':
      return [
        { key: 'accountCode', label: t('code'), align: 'left' as const, format: 'text' as const },
        { key: 'accountName', label: t('account'), align: 'left' as const, format: 'text' as const },
        { key: 'accountType', label: t('category'), align: 'left' as const, format: 'text' as const },
        { key: 'debit', label: t('debit'), ...currency },
        { key: 'credit', label: t('credit'), ...currency },
        { key: 'balance', label: t('balance'), ...currency },
      ]
    case 'ledger':
    case 'bank-book':
    case 'cash-book':
      return [
        { key: 'date', label: t('date'), align: 'left' as const, format: 'date' as const },
        { key: 'entryNo', label: t('entryNo'), align: 'left' as const, format: 'text' as const },
        { key: 'description', label: t('description'), align: 'left' as const, format: 'text' as const },
        { key: 'debit', label: t('debit'), ...currency },
        { key: 'credit', label: t('credit'), ...currency },
        { key: 'balance', label: t('balance'), ...currency },
      ]
    case 'day-book':
      return [
        { key: 'date', label: t('date'), align: 'left' as const, format: 'date' as const },
        { key: 'entryNo', label: t('entryNo'), align: 'left' as const, format: 'text' as const },
        { key: 'description', label: t('description'), align: 'left' as const, format: 'text' as const },
        { key: 'totalDebit', label: t('debit'), ...currency },
        { key: 'totalCredit', label: t('credit'), ...currency },
      ]
    case 'fund-position':
    case 'grant-financial':
      return [
        { key: 'grantNo', label: t('grantNo'), align: 'left' as const, format: 'text' as const },
        { key: 'grantTitle', label: t('grantTitle'), align: 'left' as const, format: 'text' as const },
        { key: 'totalIncome', label: t('income'), ...currency },
        { key: 'totalExpenses', label: t('expense'), ...currency },
        { key: 'fundBalance', label: t('balance'), ...currency },
        { key: 'utilizationRate', label: t('utilization'), align: 'right' as const, format: 'text' as const },
      ]
    case 'fund-balance-changes':
      return [
        { key: 'label', label: t('item'), align: 'left' as const, format: 'text' as const },
        { key: 'amount', label: t('amount'), ...currency, bold: true },
      ]
    case 'cash-flow':
      return [
        { key: 'category', label: t('category'), align: 'left' as const, format: 'text' as const },
        { key: 'accountName', label: t('account'), align: 'left' as const, format: 'text' as const },
        { key: 'amount', label: t('amount'), ...currency },
      ]
    case 'bank-reconciliation-statement':
      return [
        { key: 'accountName', label: t('bankAccount'), align: 'left' as const, format: 'text' as const },
        { key: 'periodEnd', label: t('period'), align: 'left' as const, format: 'date' as const },
        { key: 'bookBalance', label: t('bookBalance'), ...currency },
        { key: 'bankBalance', label: t('bankBalance'), ...currency },
        { key: 'difference', label: t('difference'), ...currency },
        { key: 'status', label: t('status'), align: 'center' as const, format: 'text' as const },
      ]
    default:
      return [
        { key: 'label', label: t('item'), align: 'left' as const, format: 'text' as const },
        { key: 'value', label: t('value'), align: 'right' as const, format: 'currency' as const },
      ]
  }
}

// Transform API data into flat rows for ReportViewer
function transformData(type: string, data: Record<string, unknown>): { rows: Record<string, unknown>[]; totals?: Record<string, unknown> } {
  if ('accounts' in data && Array.isArray(data.accounts)) {
    return {
      rows: data.accounts as Record<string, unknown>[],
      totals: data.totals as Record<string, unknown> | undefined,
    }
  }
  // Ledger summary mode — per-account totals
  if (type === 'ledger' && data.mode === 'summary' && 'accounts' in data) {
    const accs = data.accounts as Record<string, unknown>[]
    return {
      rows: accs,
      totals: { accountCode: '', accountName: 'Total', debit: data.totalDebit, credit: data.totalCredit, balance: '' },
    }
  }
  // Ledger single-account mode or other entry-based reports
  if ('entries' in data && Array.isArray(data.entries)) {
    const entries = data.entries as Record<string, unknown>[]
    const summary = data.summary as Record<string, unknown> | undefined
    const totalsRow: Record<string, unknown> = { description: 'Total', entryNo: '' }
    if (data.totalDebit !== undefined) totalsRow.debit = data.totalDebit
    if (data.totalCredit !== undefined) totalsRow.credit = data.totalCredit
    if (data.closingBalance !== undefined) totalsRow.balance = data.closingBalance
    if (summary) Object.assign(totalsRow, summary)
    return {
      rows: entries,
      totals: totalsRow,
    }
  }
  if ('grants' in data && Array.isArray(data.grants)) {
    const grants = data.grants as Record<string, unknown>[]
    const summary = data.summary as Record<string, unknown> | undefined
    return {
      rows: grants.map(g => ({
        ...g,
        utilizationRate: `${Number(g.utilizationRate || 0).toFixed(1)}%`,
      })),
      totals: summary ? { grantTitle: 'Total', ...summary } : undefined,
    }
  }
  if ('reconciliations' in data && Array.isArray(data.reconciliations)) {
    return {
      rows: (data.reconciliations as Record<string, unknown>[]).map(r => ({
        ...(r as { bankAccount?: Record<string, unknown> }).bankAccount,
        ...(r as Record<string, unknown>),
        accountName: ((r as { bankAccount?: Record<string, unknown> }).bankAccount as Record<string, unknown>)?.accountName,
      })),
    }
  }
  if (type === 'income-statement') {
    // API: { income: { accounts: [...], total }, expenses: { accounts: [...], total }, netSurplusDeficit }
    const incomeSection = data.income as Record<string, unknown> | undefined
    const expenseSection = data.expenses as Record<string, unknown> | undefined
    const incomeAccounts = (incomeSection?.accounts as Record<string, unknown>[]) || []
    const expenseAccounts = (expenseSection?.accounts as Record<string, unknown>[]) || []
    return {
      rows: [
        { accountCode: '', accountName: 'INCOME', amount: incomeSection?.total || '', _isGroup: true },
        ...incomeAccounts,
        { accountCode: '', accountName: 'EXPENSES', amount: expenseSection?.total || '', _isGroup: true },
        ...expenseAccounts,
      ],
      totals: { accountName: 'Net Surplus / (Deficit)', amount: data.netSurplusDeficit },
    }
  }
  if (type === 'balance-sheet') {
    // API: { assets: { accounts, total }, liabilities: { accounts, total }, equity: { accounts, total, netSurplusDeficit } }
    const assetSection = data.assets as Record<string, unknown> | undefined
    const liabSection = data.liabilities as Record<string, unknown> | undefined
    const equitySection = data.equity as Record<string, unknown> | undefined
    const assetAccounts = (assetSection?.accounts as Record<string, unknown>[]) || []
    const liabAccounts = (liabSection?.accounts as Record<string, unknown>[]) || []
    const equityAccounts = (equitySection?.accounts as Record<string, unknown>[]) || []
    return {
      rows: [
        { accountCode: '', accountName: 'ASSETS', balance: assetSection?.total || '', _isGroup: true },
        ...assetAccounts,
        { accountCode: '', accountName: 'LIABILITIES', balance: liabSection?.total || '', _isGroup: true },
        ...liabAccounts,
        { accountCode: '', accountName: 'EQUITY / FUND BALANCE', balance: equitySection?.totalWithSurplus || equitySection?.total || '', _isGroup: true },
        ...equityAccounts,
        ...(equitySection?.netSurplusDeficit ? [{ accountCode: '', accountName: 'Net Surplus / (Deficit)', balance: equitySection.netSurplusDeficit }] : []),
      ],
      totals: { accountName: 'Total Assets = Liabilities + Equity', balance: data.totalLiabilitiesAndEquity },
    }
  }
  if (type === 'cash-flow') {
    // API: { operatingActivities: { inflows: { accounts, total }, outflows: { accounts, total }, net }, netCashFlow }
    const ops = data.operatingActivities as Record<string, unknown> | undefined
    const inflows = ((ops?.inflows as Record<string, unknown>)?.accounts as Record<string, unknown>[]) || []
    const outflows = ((ops?.outflows as Record<string, unknown>)?.accounts as Record<string, unknown>[]) || []
    return {
      rows: [
        { category: 'OPERATING INFLOWS', accountName: '', amount: (ops?.inflows as Record<string, unknown>)?.total || '', _isGroup: true },
        ...inflows.map(a => ({ category: '', ...a })),
        { category: 'OPERATING OUTFLOWS', accountName: '', amount: (ops?.outflows as Record<string, unknown>)?.total || '', _isGroup: true },
        ...outflows.map(a => ({ category: '', accountName: a.accountName, amount: a.amount })),
      ],
      totals: { category: 'Net Cash Flow', accountName: '', amount: data.netCashFlow },
    }
  }
  if (type === 'receipts-payments') {
    // API: { receipts: [...], payments: [...], summary: { totalReceipts, totalPayments, netSurplus } }
    const receipts = (data.receipts as Record<string, unknown>[]) || []
    const payments = (data.payments as Record<string, unknown>[]) || []
    const summary = data.summary as Record<string, unknown> | undefined
    return {
      rows: [
        { accountCode: '', accountName: 'RECEIPTS', amount: summary?.totalReceipts || '', _isGroup: true },
        ...receipts,
        { accountCode: '', accountName: 'PAYMENTS', amount: summary?.totalPayments || '', _isGroup: true },
        ...payments,
      ],
      totals: { accountName: 'Net Surplus / (Deficit)', amount: summary?.netSurplus },
    }
  }
  if (type === 'fund-balance-changes') {
    // API: { openingFundBalance, totalIncome, totalExpenses, netSurplus, closingFundBalance }
    return {
      rows: [
        { label: 'Opening Fund Balance', amount: data.openingFundBalance },
        { label: 'Add: Total Income', amount: data.totalIncome },
        { label: 'Less: Total Expenses', amount: data.totalExpenses },
        { label: 'Net Surplus / (Deficit)', amount: data.netSurplus, _isGroup: true },
        { label: 'Closing Fund Balance', amount: data.closingFundBalance, _isGroup: true },
      ],
    }
  }
  // Fallback
  return { rows: [] }
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string
  const t = useTranslations('finance.financialReports')
  const tr = useTranslations('finance.financialReports.reportViewer')
  const tc = useTranslations('common')

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showZero, setShowZero] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [orgName, setOrgName] = useState('')

  // Ledger-specific: account filter
  const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>([])
  const [accountId, setAccountId] = useState('')

  const fetchInit = useCallback(async () => {
    try {
      const fetches: Promise<Response>[] = [
        fetch('/api/v1/settings/fiscal-years'),
        fetch('/api/v1/settings/organization'),
      ]
      // Fetch accounts list for ledger report
      if (type === 'ledger') {
        fetches.push(fetch('/api/v1/finance/accounts?isGroup=false&limit=500'))
      }
      const responses = await Promise.all(fetches)
      const jsons = await Promise.all(responses.map(r => r.json()))

      if (jsons[0].success) {
        setFiscalYears(jsons[0].data)
        const current = jsons[0].data.find((fy: FiscalYear) => fy.isCurrent)
        if (current) {
          setFiscalYearId(current.id)
          setStartDate(current.startDate.split('T')[0])
          setEndDate(current.endDate.split('T')[0])
        }
      }
      if (jsons[1].success) setOrgName(jsons[1].data.name)
      if (jsons[2]?.success) {
        setAccounts(jsons[2].data.map((a: Record<string, string>) => ({ id: a.id, code: a.code, name: a.name })))
      }
    } catch { /* ignore */ }
  }, [type])

  useEffect(() => { fetchInit() }, [fetchInit])

  async function generateReport() {
    if (!fiscalYearId) return
    setLoading(true)
    try {
      let url = `/api/v1/finance/reports/${type}?fiscalYearId=${fiscalYearId}`
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`
      if (type === 'ledger' && accountId && accountId !== '_all') url += `&accountId=${accountId}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) setReportData(json.data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  // Auto-generate when fiscal year or account changes
  useEffect(() => {
    if (fiscalYearId) generateReport()
  }, [fiscalYearId, accountId]) // eslint-disable-line react-hooks/exhaustive-deps

  const reportTitle = type === 'ledger' && reportData?.accountName
    ? `${t(`types.${type}.title`)} — ${reportData.accountName}`
    : t(`types.${type}.title`)

  // For ledger summary mode, use different columns
  const effectiveType = type === 'ledger' && reportData?.mode === 'summary' ? 'ledger-summary' : type
  const columns = getColumns(effectiveType, tr)
  const { rows, totals } = reportData ? transformData(type, reportData) : { rows: [], totals: undefined }
  const filteredRows = showZero ? rows : rows.filter(r => {
    if (r._isGroup) return true
    // Keep rows that have non-zero values
    return columns.some(c => {
      const v = Number(r[c.key])
      return c.format === 'currency' && v !== 0
    }) || columns.every(c => c.format !== 'currency')
  })

  const periodStr = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`
    : ''

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="print:hidden">
        <PageHeader title={reportTitle} description={t(`types.${type}.desc`)}>
          <Button variant="outline" size="sm" onClick={() => router.push('/finance/financial-reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
      </div>

      {/* Filters — hidden in print */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fiscalYear')}</Label>
              <Select value={fiscalYearId} onValueChange={(v) => {
                setFiscalYearId(v)
                const fy = fiscalYears.find(f => f.id === v)
                if (fy) { setStartDate(fy.startDate.split('T')[0]); setEndDate(fy.endDate.split('T')[0]) }
              }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fiscalYears.map(fy => (
                    <SelectItem key={fy.id} value={fy.id}>
                      {fy.name} {fy.isCurrent && <Badge variant="secondary" className="ml-1 text-[10px]">Current</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type === 'ledger' && accounts.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">{tr('account')}</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="w-56"><SelectValue placeholder={tr('allAccounts')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">{tr('allAccounts')}</SelectItem>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="font-mono text-xs mr-1.5">{a.code}</span>{a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">{tr('from')}</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{tr('to')}</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showZero} onCheckedChange={setShowZero} id="show-zero" />
              <Label htmlFor="show-zero" className="text-xs">{tr('showZero')}</Label>
            </div>
            <Button size="sm" onClick={generateReport} disabled={loading || !fiscalYearId}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {t('generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {loading ? (
        <div className="flex items-center justify-center py-12 print:hidden">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ReportViewer
          title={reportTitle}
          orgName={orgName}
          period={periodStr}
          columns={columns}
          rows={filteredRows}
          totals={totals}
          emptyMessage={tr('noData')}
        />
      )}
    </div>
  )
}
