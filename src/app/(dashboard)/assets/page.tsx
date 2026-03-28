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

export default function AssetsPage() {
  const t = useTranslations('assets')
  const router = useRouter()
  const { formatCurrency } = useFormatters()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Asset>[] = [
    { accessorKey: 'assetNo', header: t('fields.assetNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('assetNo')}</span> },
    { accessorKey: 'name', header: t('fields.name'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { id: 'categoryName', header: t('fields.category'), cell: ({ row }) => {
      const asset = row.original
      return asset.category?.name || asset.categoryName || '\u2014'
    }},
    { accessorKey: 'purchasePrice', header: t('fields.purchasePrice'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('purchasePrice')))}</span> },
    { accessorKey: 'netBookValue', header: t('fields.netBookValue'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('netBookValue')))}</span> },
    { accessorKey: 'condition', header: t('fields.condition'), cell: ({ row }) => <StatusBadge status={row.getValue('condition')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/assets?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setAssets(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={() => router.push('/assets/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('registerAsset')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={assets}
        searchKey="name"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/assets/${row.id}`)}
      />
    </div>
  )
}
