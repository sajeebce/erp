'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const TRANSACTION_TYPES = [
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
]

interface FundData {
  fundBalance: number
  totalDeposits: number
  totalWithdrawals: number
  fdrDetails?: {
    bankName: string
    accountNo: string
    maturityDate: string
    interestRate: number
    principal: number
  } | null
  transactions: FundTransaction[]
}

interface FundTransaction {
  id: string
  date: string
  type: string
  amount: number
  balance: number
  description: string
}

export default function GratuityFundPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [fund, setFund] = useState<FundData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Transaction form
  const [txType, setTxType] = useState('DEPOSIT')
  const [txAmount, setTxAmount] = useState('')
  const [txDescription, setTxDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchFund()
  }, [])

  function fetchFund() {
    setLoading(true)
    fetch('/api/v1/hr/gratuity/fund')
      .then(res => res.json())
      .then(json => { if (json.success) setFund(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function handleRecordTransaction() {
    if (!txAmount || parseFloat(txAmount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/v1/hr/gratuity/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: txType,
          amount: parseFloat(txAmount),
          description: txDescription.trim() || null,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setSuccess('Transaction recorded successfully.')
        setTxAmount('')
        setTxDescription('')
        setShowForm(false)
        fetchFund()
      } else {
        setError(json.error || 'Failed to record transaction.')
      }
    } catch {
      setError('Failed to record transaction.')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<FundTransaction>[] = [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.getValue('date')) },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => {
      const type = row.original.type
      return (
        <span className={`font-mono text-sm ${type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
          {type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(row.getValue('amount'))}
        </span>
      )
    }},
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('balance'))}</span> },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.getValue('description') || '\u2014' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Fund Management" description="Manage gratuity fund deposits, withdrawals, and FDR investments">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Record Transaction'}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Fund Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Fund Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fund ? formatCurrency(fund.fundBalance) : '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fund ? formatCurrency(fund.totalDeposits) : '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{fund ? formatCurrency(fund.totalWithdrawals) : '\u2014'}</p>
          </CardContent>
        </Card>
      </div>

      {/* FDR Details */}
      {fund?.fdrDetails && (
        <Card>
          <CardHeader>
            <CardTitle>FDR Investment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{fund.fdrDetails.bankName}</span></div>
              <div><span className="text-muted-foreground">Account:</span> <span className="font-mono">{fund.fdrDetails.accountNo}</span></div>
              <div><span className="text-muted-foreground">Principal:</span> <span className="font-mono">{formatCurrency(fund.fdrDetails.principal)}</span></div>
              <div><span className="text-muted-foreground">Interest Rate:</span> <span className="font-mono">{fund.fdrDetails.interestRate}%</span></div>
              <div><span className="text-muted-foreground">Maturity:</span> <span className="font-medium">{formatDate(fund.fdrDetails.maturityDate)}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Transaction Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-type">Transaction Type *</Label>
                <SearchableSelect
                  id="tx-type"
                  options={TRANSACTION_TYPES}
                  value={txType}
                  onValueChange={setTxType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount *</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-desc">Description</Label>
              <Textarea
                id="tx-desc"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                rows={2}
                placeholder="Optional description..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleRecordTransaction} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Record Transaction'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={fund?.transactions || []}
            searchKey="description"
            searchPlaceholder="Search transactions..."
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
