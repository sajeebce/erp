'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

interface Samity {
  id: string
  samityNo: string
  name: string
  branch?: { name: string }
  branchName?: string
  meetingDay: string
  totalMembers: number
  status: string
}

const columns: ColumnDef<Samity>[] = [
  { accessorKey: 'samityNo', header: 'Samity No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('samityNo')}</span> },
  { accessorKey: 'name', header: 'Samity Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { id: 'branchName', header: 'Branch', cell: ({ row }) => {
    const samity = row.original
    return samity.branch?.name || samity.branchName || '\u2014'
  }},
  { accessorKey: 'meetingDay', header: 'Meeting Day' },
  { accessorKey: 'totalMembers', header: 'Members', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('totalMembers') ?? 0}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function SamityPage() {
  const router = useRouter()
  const [samities, setSamities] = useState<Samity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/microfinance/samity?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setSamities(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Samity Management" description="Manage microfinance groups, members, and meeting schedules">
        <Button size="sm" onClick={() => router.push('/microfinance/samity/new')}>
          <Plus className="h-4 w-4 mr-2" />New Samity
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={samities}
        searchKey="name"
        searchPlaceholder="Search samities..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/microfinance/samity/${row.id}`)}
      />
    </div>
  )
}
