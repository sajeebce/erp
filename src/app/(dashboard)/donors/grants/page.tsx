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

interface Grant {
  id: string
  grantNo: string
  title: string
  donor?: { name: string }
  donorName?: string
  awardAmount: string | number
  status: string
  lifecycleStage: string
}

const columns: ColumnDef<Grant>[] = [
  { accessorKey: 'grantNo', header: 'Grant No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('grantNo')}</span> },
  { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.getValue('title')}</span> },
  { id: 'donorName', header: 'Donor', cell: ({ row }) => {
    const grant = row.original
    return grant.donor?.name || grant.donorName || '\u2014'
  }},
  { accessorKey: 'awardAmount', header: 'Award Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('awardAmount')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  { accessorKey: 'lifecycleStage', header: 'Lifecycle Stage', cell: ({ row }) => <StatusBadge status={row.getValue('lifecycleStage')} /> },
]

export default function GrantsPage() {
  const router = useRouter()
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/donors/grants?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setGrants(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Grant Registry" description="Track and manage active grants from all donors">
        <Button size="sm" onClick={() => router.push('/donors/grants/new')}>
          <Plus className="h-4 w-4 mr-2" />Add Grant
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={grants}
        searchKey="title"
        searchPlaceholder="Search grants..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/donors/grants/${row.id}`)}
      />
    </div>
  )
}
