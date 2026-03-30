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

interface PFLoan {
  id: string
  loanNo: string
  employee?: { fullName: string }
  employeeName?: string
  principalAmount: number
  monthlyInstallment: number
  outstandingBalance: number
  status: string
}

export default function PFLoansPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency } = useFormatters()
  const [loans, setLoans] = useState<PFLoan[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFLoan>[] = [
    { accessorKey: 'loanNo', header: 'Loan No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('loanNo')}</span> },
    { id: 'employeeName', header: 'Employee', accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'principalAmount', header: 'Principal', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('principalAmount'))}</span> },
    { accessorKey: 'monthlyInstallment', header: 'EMI', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('monthlyInstallment'))}</span> },
    { accessorKey: 'outstandingBalance', header: 'Outstanding', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('outstandingBalance'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/loans?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setLoans(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="PF Loans" description="Manage provident fund loan applications">
        <Button size="sm" onClick={() => router.push('/hr/pension/provident-fund/loans/new')}>
          <Plus className="h-4 w-4 mr-2" />Apply for Loan
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={loans}
        searchKey="employeeName"
        searchPlaceholder="Search loans..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/provident-fund/loans/${row.id}`)}
      />
    </div>
  )
}
