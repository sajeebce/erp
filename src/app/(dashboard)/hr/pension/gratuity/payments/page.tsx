'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface GratuityPayment {
  id: string
  paymentNo: string
  employeeName: string
  paymentType: string
  amount: number
  status: string
  paidAt: string | null
}

export default function GratuityPaymentsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [payments, setPayments] = useState<GratuityPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/payments')
      .then(res => res.json())
      .then(json => { if (json.success) setPayments(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<GratuityPayment>[] = [
    { accessorKey: 'paymentNo', header: 'Payment No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('paymentNo')}</span> },
    { accessorKey: 'employeeName', header: 'Employee', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'paymentType', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('paymentType')} /> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('amount'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'paidAt', header: 'Paid Date', cell: ({ row }) => row.getValue('paidAt') ? formatDate(row.getValue('paidAt') as string) : '\u2014' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Payments" description="Manage gratuity disbursements, settlements, and partial payments">
        <Button size="sm" onClick={() => router.push('/hr/pension/gratuity/payments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={payments}
        searchKey="employeeName"
        searchPlaceholder="Search payments..."
        isLoading={loading}
      />
    </div>
  )
}
