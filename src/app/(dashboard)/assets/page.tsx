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

interface Asset {
  id: string
  assetNo: string
  name: string
  category?: { name: string }
  categoryName?: string
  purchasePrice: string | number
  netBookValue: string | number
  condition: string
}

const columns: ColumnDef<Asset>[] = [
  { accessorKey: 'assetNo', header: 'Asset No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('assetNo')}</span> },
  { accessorKey: 'name', header: 'Asset Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { id: 'categoryName', header: 'Category', cell: ({ row }) => {
    const asset = row.original
    return asset.category?.name || asset.categoryName || '\u2014'
  }},
  { accessorKey: 'purchasePrice', header: 'Purchase Price', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('purchasePrice')))}</span> },
  { accessorKey: 'netBookValue', header: 'Net Book Value', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('netBookValue')))}</span> },
  { accessorKey: 'condition', header: 'Condition', cell: ({ row }) => <StatusBadge status={row.getValue('condition')} /> },
]

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/assets?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setAssets(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Asset Register" description="Track and manage organizational fixed assets">
        <Button size="sm" onClick={() => router.push('/assets/new')}>
          <Plus className="h-4 w-4 mr-2" />Register Asset
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={assets}
        searchKey="name"
        searchPlaceholder="Search assets..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/assets/${row.id}`)}
      />
    </div>
  )
}
