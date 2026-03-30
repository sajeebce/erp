'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface EmployeeLedger {
  employeeId: string
  employeeName: string
  employeeNo: string
  department: string
  joiningDate: string
  serviceYears: number
  totalAccrued: number
  totalPaid: number
  currentBalance: number
  isVested: boolean
  policyName: string
  accruals: AccrualEntry[]
  payments: PaymentEntry[]
}

interface AccrualEntry {
  id: string
  month: number
  year: number
  basicSalary: number
  accrualAmount: number
  runningBalance: number
}

interface PaymentEntry {
  id: string
  paymentNo: string
  date: string
  paymentType: string
  amount: number
  status: string
}

export default function EmployeeGratuityStatementPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [ledger, setLedger] = useState<EmployeeLedger | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.employeeId) return

    fetch(`/api/v1/hr/gratuity/ledgers/${params.employeeId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setLedger(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.employeeId, tc])

  const accrualColumns: ColumnDef<AccrualEntry>[] = [
    { accessorKey: 'month', header: 'Month' },
    { accessorKey: 'year', header: 'Year' },
    { accessorKey: 'basicSalary', header: 'Basic Salary', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('basicSalary'))}</span> },
    { accessorKey: 'accrualAmount', header: 'Accrual', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('accrualAmount'))}</span> },
    { accessorKey: 'runningBalance', header: 'Running Balance', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('runningBalance'))}</span> },
  ]

  const paymentColumns: ColumnDef<PaymentEntry>[] = [
    { accessorKey: 'paymentNo', header: 'Payment No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('paymentNo')}</span> },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.getValue('date')) },
    { accessorKey: 'paymentType', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('paymentType')} /> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('amount'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ledger) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Gratuity Statement" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/ledgers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Gratuity Statement: ${ledger.employeeName}`}
        description={`Employee No: ${ledger.employeeNo} | Policy: ${ledger.policyName}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/ledgers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {/* Employee Info */}
      <Card>
        <CardHeader><CardTitle>Employee Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{ledger.department}</span></div>
            <div><span className="text-muted-foreground">Joining Date:</span> <span className="font-medium">{formatDate(ledger.joiningDate)}</span></div>
            <div><span className="text-muted-foreground">Service:</span> <span className="font-medium">{ledger.serviceYears.toFixed(1)} years</span></div>
            <div><span className="text-muted-foreground">Vested:</span> <StatusBadge status={ledger.isVested ? 'VESTED' : 'NOT_VESTED'} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Accrued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ledger.totalAccrued)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(ledger.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(ledger.currentBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Accrual History */}
      <Card>
        <CardHeader>
          <CardTitle>Accrual History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={accrualColumns}
            data={ledger.accruals}
            searchKey="year"
            searchPlaceholder="Search by year..."
          />
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={paymentColumns}
            data={ledger.payments}
            searchKey="paymentNo"
            searchPlaceholder="Search payments..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
