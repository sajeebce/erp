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

export default function DonorsPage() {
  const router = useRouter()
  const t = useTranslations('donors')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Donor>[] = [
    { accessorKey: 'name', header: t('fields.donorName'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'type', header: tc('labels.type'), cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
    { accessorKey: 'country', header: t('fields.country') },
    { accessorKey: 'totalFunded', header: t('fields.totalFunded'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalFunded')))}</span> },
    { id: 'grantCount', header: t('fields.grants'), cell: ({ row }) => {
      const donor = row.original
      return donor._count?.grants ?? donor.grantCount ?? 0
    }},
    { accessorKey: 'relationshipStatus', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('relationshipStatus')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/donors?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setDonors(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('directory.title')} description={t('directory.description')}>
        <Button size="sm" onClick={() => router.push('/donors/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('addDonor')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={donors}
        searchKey="name"
        searchPlaceholder={t('directory.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/donors/${row.id}`)}
      />
    </div>
  )
}
