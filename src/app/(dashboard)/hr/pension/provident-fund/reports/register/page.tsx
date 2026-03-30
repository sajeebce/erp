'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Download } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface PFRegisterEntry {
  id: string
  employeeNo: string
  employeeName: string
  department: string
  enrollmentDate: string
  employeeContrib: number
  employerContrib: number
  interestEarned: number
  withdrawals: number
  loanOutstanding: number
  netBalance: number
  status: string
}

export default function PFRegisterPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [entries, setEntries] = useState<PFRegisterEntry[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFRegisterEntry>[] = [
    { accessorKey: 'employeeNo', header: 'Emp No', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employeeNo')}</span> },
    { accessorKey: 'employeeName', header: 'Name', cell: ({ row }) => <span className="font-medium">{row.getValue('employeeName')}</span> },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'enrollmentDate', header: 'Enrolled', cell: ({ row }) => formatDate(row.getValue('enrollmentDate')) },
    { accessorKey: 'employeeContrib', header: 'Employee', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('employeeContrib'))}</span> },
    { accessorKey: 'employerContrib', header: 'Employer', cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(row.getValue('employerContrib'))}</span> },
    { accessorKey: 'interestEarned', header: 'Interest', cell: ({ row }) => <span className="font-mono text-sm text-green-600">{formatCurrency(row.getValue('interestEarned'))}</span> },
    { accessorKey: 'withdrawals', header: 'Withdrawals', cell: ({ row }) => <span className="font-mono text-sm text-red-600">{formatCurrency(row.getValue('withdrawals'))}</span> },
    { accessorKey: 'loanOutstanding', header: 'Loans', cell: ({ row }) => <span className="font-mono text-sm text-orange-600">{formatCurrency(row.getValue('loanOutstanding'))}</span> },
    { accessorKey: 'netBalance', header: 'Net Balance', cell: ({ row }) => <span className="font-mono text-sm font-bold">{formatCurrency(row.getValue('netBalance'))}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/reports/register?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEntries(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = entries.reduce((sum, e) => sum + e.netBalance, 0)
  const totalEmployeeContrib = entries.reduce((sum, e) => sum + e.employeeContrib, 0)
  const totalEmployerContrib = entries.reduce((sum, e) => sum + e.employerContrib, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="PF Register" description="Complete provident fund register with all member balances">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Employee Contributions</p>
          <p className="text-xl font-bold font-mono">{formatCurrency(totalEmployeeContrib)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Employer Contributions</p>
          <p className="text-xl font-bold font-mono">{formatCurrency(totalEmployerContrib)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Net Balance</p>
          <p className="text-xl font-bold font-mono">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        searchKey="employeeName"
        searchPlaceholder="Search members..."
        isLoading={loading}
      />
    </div>
  )
}
