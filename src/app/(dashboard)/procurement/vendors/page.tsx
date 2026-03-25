'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Star } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'

interface Vendor {
  id: string
  vendorNo: string
  companyName: string
  category: string
  rating: number
  totalOrders: number
  isApproved: boolean
}

function renderRating(rating: number) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-mono">{rating?.toFixed(1) ?? '0.0'}</span>
    </div>
  )
}

const columns: ColumnDef<Vendor>[] = [
  { accessorKey: 'vendorNo', header: 'Vendor No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('vendorNo')}</span> },
  { accessorKey: 'companyName', header: 'Company Name', cell: ({ row }) => <span className="font-medium">{row.getValue('companyName')}</span> },
  { accessorKey: 'category', header: 'Category', cell: ({ row }) => <StatusBadge status={row.getValue('category')} /> },
  { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => renderRating(Number(row.getValue('rating'))) },
  { accessorKey: 'totalOrders', header: 'Total Orders', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('totalOrders') ?? 0}</span> },
  { accessorKey: 'isApproved', header: 'Approved', cell: ({ row }) => {
    const approved = row.getValue('isApproved')
    return (
      <Badge variant={approved ? 'default' : 'outline'} className="text-[11px]">
        {approved ? 'Approved' : 'Pending'}
      </Badge>
    )
  }},
]

export default function VendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/procurement/vendors?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setVendors(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Management" description="Manage vendor registry and performance tracking">
        <Button size="sm" onClick={() => router.push('/procurement/vendors/new')}>
          <Plus className="h-4 w-4 mr-2" />Add Vendor
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={vendors}
        searchKey="companyName"
        searchPlaceholder="Search vendors..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/procurement/vendors/${row.id}`)}
      />
    </div>
  )
}
