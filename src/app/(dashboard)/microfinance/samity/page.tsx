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

export default function SamityPage() {
  const t = useTranslations('microfinance')
  const tc = useTranslations('common')

  const columns: ColumnDef<Samity>[] = [
    { accessorKey: 'samityNo', header: t('samity.samityNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('samityNo')}</span> },
    { accessorKey: 'name', header: t('samity.name'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { id: 'branchName', header: t('samity.branch'), cell: ({ row }) => {
      const samity = row.original
      return samity.branch?.name || samity.branchName || '\u2014'
    }},
    { accessorKey: 'meetingDay', header: t('samity.meetingDay') },
    { accessorKey: 'totalMembers', header: t('samity.members'), cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('totalMembers') ?? 0}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]
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
      <PageHeader title={t('samity.title')} description={t('samity.description')}>
        <Button size="sm" onClick={() => router.push('/microfinance/samity/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('samity.newSamity')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={samities}
        searchKey="name"
        searchPlaceholder={t('samity.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/microfinance/samity/${row.id}`)}
      />
    </div>
  )
}
