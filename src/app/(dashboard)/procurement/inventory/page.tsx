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

export default function InventoryPage() {
  const t = useTranslations('procurement')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatNumber } = useFormatters()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<InventoryItem>[] = [
    { accessorKey: 'itemCode', header: t('inventory.itemCode'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('itemCode')}</span> },
    { accessorKey: 'name', header: t('inventory.itemName'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'category', header: t('inventory.category'), cell: ({ row }) => <StatusBadge status={row.getValue('category')} /> },
    { accessorKey: 'unit', header: t('inventory.unit') },
    { accessorKey: 'stockInHand', header: t('inventory.stockInHand'), cell: ({ row }) => <span className="font-mono text-sm">{formatNumber(Number(row.getValue('stockInHand')))}</span> },
    { accessorKey: 'reorderLevel', header: t('inventory.reorderLevel'), cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{formatNumber(Number(row.getValue('reorderLevel')))}</span> },
    { accessorKey: 'totalValue', header: t('inventory.totalValue'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalValue')))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/procurement/inventory?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setItems(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('inventory.title')} description={t('inventory.description')}>
        <Button size="sm" onClick={() => router.push('/procurement/inventory/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('inventory.addItem')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={items}
        searchKey="name"
        searchPlaceholder={t('inventory.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/procurement/inventory/${row.id}`)}
      />
    </div>
  )
}
