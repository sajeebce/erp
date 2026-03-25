'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT, formatPercent } from '@/lib/formatters'

interface Budget {
  id: string
  name: string
  project?: { name: string }
  projectName?: string
  totalAmount: string | number
  status: string
  utilizationPercent: string | number
}

const columns: ColumnDef<Budget>[] = [
  { accessorKey: 'name', header: 'Budget Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'projectName', header: 'Project', cell: ({ row }) => {
    const budget = row.original
    return budget.project?.name || budget.projectName || '\u2014'
  }},
  { accessorKey: 'totalAmount', header: 'Total Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalAmount')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  { accessorKey: 'utilizationPercent', header: 'Utilization', cell: ({ row }) => {
    const value = Number(row.getValue('utilizationPercent'))
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="text-sm font-mono">{formatPercent(value)}</span>
      </div>
    )
  }},
]

export default function BudgetPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/budget?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setBudgets(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Budget Management" description="Monitor and manage project budgets across all programs">
        <Button size="sm" onClick={() => router.push('/budget/new')}>
          <Plus className="h-4 w-4 mr-2" />Create Budget
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={budgets}
        searchKey="name"
        searchPlaceholder="Search budgets..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/budget/${row.id}`)}
      />
    </div>
  )
}
