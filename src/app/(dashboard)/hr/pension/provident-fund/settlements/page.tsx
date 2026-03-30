'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface PFSettlement {
  id: string
  settlementNo: string
  employee?: { fullName: string }
  employeeName?: string
  totalAmount: number
  netPayable: number
  status: string
  createdAt: string
}

export default function PFSettlementsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [settlements, setSettlements] = useState<PFSettlement[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFSettlement>[] = [
    { accessorKey: 'settlementNo', header: 'Settlement No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('settlementNo')}</span> },
    { id: 'employeeName', header: 'Employee', accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'totalAmount', header: 'Total Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalAmount'))}</span> },
    { accessorKey: 'netPayable', header: 'Net Payable', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('netPayable'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => formatDate(row.getValue('createdAt')) },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/settlements?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setSettlements(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="PF Settlements" description="Final settlement of provident fund for departing employees" />

      <DataTable
        columns={columns}
        data={settlements}
        searchKey="employeeName"
        searchPlaceholder="Search settlements..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/provident-fund/settlements/${row.id}`)}
      />
    </div>
  )
}
