'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT, formatNumber } from '@/lib/formatters'

interface InventoryItem {
  id: string
  itemCode: string
  name: string
  category: string
  unit: string
  stockInHand: number
  reorderLevel: number
  totalValue: string | number
  status: string
}

const columns: ColumnDef<InventoryItem>[] = [
  { accessorKey: 'itemCode', header: 'Item Code', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('itemCode')}</span> },
  { accessorKey: 'name', header: 'Item Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'category', header: 'Category', cell: ({ row }) => <StatusBadge status={row.getValue('category')} /> },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'stockInHand', header: 'Stock In Hand', cell: ({ row }) => <span className="font-mono text-sm">{formatNumber(Number(row.getValue('stockInHand')))}</span> },
  { accessorKey: 'reorderLevel', header: 'Reorder Level', cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{formatNumber(Number(row.getValue('reorderLevel')))}</span> },
  { accessorKey: 'totalValue', header: 'Total Value', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalValue')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/procurement/inventory?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setItems(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Track inventory levels and stock movements">
        <Button size="sm" onClick={() => router.push('/procurement/inventory/new')}>
          <Plus className="h-4 w-4 mr-2" />Add Item
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={items}
        searchKey="name"
        searchPlaceholder="Search inventory..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/procurement/inventory/${row.id}`)}
      />
    </div>
  )
}
