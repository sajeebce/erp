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

interface PFWithdrawal {
  id: string
  withdrawalNo: string
  employee?: { fullName: string }
  employeeName?: string
  amount: number
  reason: string
  status: string
  createdAt: string
}

export default function PFWithdrawalsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()
  const [withdrawals, setWithdrawals] = useState<PFWithdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFWithdrawal>[] = [
    { accessorKey: 'withdrawalNo', header: 'Withdrawal No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('withdrawalNo')}</span> },
    { id: 'employeeName', header: 'Employee', accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('amount'))}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <StatusBadge status={row.getValue('reason')} /> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/withdrawals?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setWithdrawals(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="PF Withdrawals" description="Manage provident fund withdrawal requests">
        <Button size="sm" onClick={() => router.push('/hr/pension/provident-fund/withdrawals/new')}>
          <Plus className="h-4 w-4 mr-2" />Apply Withdrawal
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={withdrawals}
        searchKey="employeeName"
        searchPlaceholder="Search withdrawals..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/provident-fund/withdrawals/${row.id}`)}
      />
    </div>
  )
}
