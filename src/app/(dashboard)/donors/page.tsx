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

interface Donor {
  id: string
  name: string
  type: string
  country: string
  totalFunded: string | number
  _count?: { grants: number }
  grantCount?: number
  relationshipStatus: string
}

const columns: ColumnDef<Donor>[] = [
  { accessorKey: 'name', header: 'Donor Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
  { accessorKey: 'country', header: 'Country' },
  { accessorKey: 'totalFunded', header: 'Total Funded', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalFunded')))}</span> },
  { id: 'grantCount', header: 'Grants', cell: ({ row }) => {
    const donor = row.original
    return donor._count?.grants ?? donor.grantCount ?? 0
  }},
  { accessorKey: 'relationshipStatus', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('relationshipStatus')} /> },
]

export default function DonorsPage() {
  const router = useRouter()
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/donors?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setDonors(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Donor Directory" description="Manage donor relationships, grants, and funding sources">
        <Button size="sm" onClick={() => router.push('/donors/new')}>
          <Plus className="h-4 w-4 mr-2" />Add Donor
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={donors}
        searchKey="name"
        searchPlaceholder="Search donors..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/donors/${row.id}`)}
      />
    </div>
  )
}
