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

interface GratuityLedger {
  id: string
  employeeId: string
  employeeName: string
  department: string
  serviceYears: number
  totalAccrued: number
  totalPaid: number
  currentBalance: number
  isVested: boolean
}

export default function GratuityLedgersPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()

  const [ledgers, setLedgers] = useState<GratuityLedger[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/ledgers')
      .then(res => res.json())
      .then(json => { if (json.success) setLedgers(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<GratuityLedger>[] = [
    { accessorKey: 'employeeName', header: 'Employee', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'serviceYears', header: 'Service (Years)', cell: ({ row }) => <span className="font-mono text-sm">{(row.getValue('serviceYears') as number).toFixed(1)}</span> },
    { accessorKey: 'totalAccrued', header: 'Total Accrued', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalAccrued'))}</span> },
    { accessorKey: 'totalPaid', header: 'Total Paid', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('totalPaid'))}</span> },
    { accessorKey: 'currentBalance', header: 'Balance', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('currentBalance'))}</span> },
    { accessorKey: 'isVested', header: 'Vested', cell: ({ row }) => <StatusBadge status={row.getValue('isVested') ? 'VESTED' : 'NOT_VESTED'} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Gratuity Ledgers" description="View gratuity balances and accrual history for all enrolled employees">
        <Button size="sm" onClick={() => router.push('/hr/pension/gratuity/ledgers/enroll')}>
          <Plus className="h-4 w-4 mr-2" />
          Enroll Employee
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={ledgers}
        searchKey="employeeName"
        searchPlaceholder="Search employees..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/gratuity/ledgers/${row.employeeId}`)}
      />
    </div>
  )
}
