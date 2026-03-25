'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT } from '@/lib/formatters'

interface LoanApplication {
  id: string
  applicationNo: string
  member?: { fullName: string }
  memberName?: string
  product?: { name: string }
  productName?: string
  amountRequested: string | number
  status: string
}

const columns: ColumnDef<LoanApplication>[] = [
  { accessorKey: 'applicationNo', header: 'Application No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('applicationNo')}</span> },
  { id: 'memberName', header: 'Member', cell: ({ row }) => {
    const app = row.original
    return <span className="font-medium">{app.member?.fullName || app.memberName || '\u2014'}</span>
  }},
  { id: 'productName', header: 'Product', cell: ({ row }) => {
    const app = row.original
    return app.product?.name || app.productName || '\u2014'
  }},
  { accessorKey: 'amountRequested', header: 'Amount Requested', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('amountRequested')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function LoanApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/microfinance/loan-applications?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setApplications(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Loan Applications" description="Process and review loan applications from members">
        <Button size="sm" onClick={() => router.push('/microfinance/loan-applications/new')}>
          <Plus className="h-4 w-4 mr-2" />New Application
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={applications}
        searchKey="applicationNo"
        searchPlaceholder="Search applications..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/microfinance/loan-applications/${row.id}`)}
      />
    </div>
  )
}
