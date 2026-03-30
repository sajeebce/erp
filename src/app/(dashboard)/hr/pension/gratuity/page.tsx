'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { DollarSign, TrendingUp, Wallet, Users } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface LiabilityReport {
  totalLiability: number
  monthlyAccrual: number
  fundBalance: number
  vestedEmployees: number
  recentAccruals: Accrual[]
  recentPayments: Payment[]
}

interface Accrual {
  id: string
  employeeName: string
  month: number
  year: number
  accrualAmount: number
  createdAt: string
}

interface Payment {
  id: string
  paymentNo: string
  employeeName: string
  paymentType: string
  amount: number
  status: string
  paidAt: string | null
}

export default function GratuityDashboardPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [report, setReport] = useState<LiabilityReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/reports/liability')
      .then(res => res.json())
      .then(json => { if (json.success) setReport(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const accrualColumns: ColumnDef<Accrual>[] = [
    { accessorKey: 'employeeName', header: 'Employee', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'month', header: 'Month' },
    { accessorKey: 'year', header: 'Year' },
    { accessorKey: 'accrualAmount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('accrualAmount'))}</span> },
  ]

  const paymentColumns: ColumnDef<Payment>[] = [
    { accessorKey: 'paymentNo', header: 'Payment No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('paymentNo')}</span> },
    { accessorKey: 'employeeName', header: 'Employee', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'paymentType', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('paymentType')} /> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('amount'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Fund" description="Manage gratuity fund policies, accruals, payments, and reporting">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push('/hr/pension/gratuity/policies')}>
            Policies
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/hr/pension/gratuity/ledgers')}>
            Ledgers
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/hr/pension/gratuity/accruals')}>
            Run Accrual
          </Button>
          <Button size="sm" onClick={() => router.push('/hr/pension/gratuity/payments')}>
            Payments
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report ? formatCurrency(report.totalLiability) : '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Accrual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report ? formatCurrency(report.monthlyAccrual) : '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Fund Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{report ? formatCurrency(report.fundBalance) : '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vested Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report?.vestedEmployees ?? '\u2014'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Accruals</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={accrualColumns}
              data={report?.recentAccruals || []}
              isLoading={loading}
              searchKey="employeeName"
              searchPlaceholder="Search accruals..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={paymentColumns}
              data={report?.recentPayments || []}
              isLoading={loading}
              searchKey="employeeName"
              searchPlaceholder="Search payments..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
