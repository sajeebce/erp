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

export default function GrantsPage() {
  const router = useRouter()
  const t = useTranslations('donors')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Grant>[] = [
    { accessorKey: 'grantNo', header: t('grants.grantNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('grantNo')}</span> },
    { accessorKey: 'title', header: t('grants.grantTitle'), cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.getValue('title')}</span> },
    { id: 'donorName', header: t('grants.donor'), cell: ({ row }) => {
      const grant = row.original
      return grant.donor?.name || grant.donorName || '\u2014'
    }},
    { accessorKey: 'awardAmount', header: t('grants.awardAmount'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('awardAmount')))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'lifecycleStage', header: t('grants.lifecycleStage'), cell: ({ row }) => <StatusBadge status={row.getValue('lifecycleStage')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/donors/grants?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setGrants(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('grants.title')} description={t('grants.description')}>
        <Button size="sm" onClick={() => router.push('/donors/grants/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('grants.addGrant')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={grants}
        searchKey="title"
        searchPlaceholder={t('grants.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/donors/grants/${row.id}`)}
      />
    </div>
  )
}
