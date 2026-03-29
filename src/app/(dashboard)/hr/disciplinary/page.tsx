'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface DisciplinaryCase {
  id: string
  caseNo: string
  employeeName?: string
  employee?: { fullName: string }
  action: string
  incidentDate: string
  status: string
  appealFiled?: boolean
}

export default function DisciplinaryPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatDate } = useFormatters()

  const [cases, setCases] = useState<DisciplinaryCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/disciplinary?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setCases(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<DisciplinaryCase>[] = [
    { accessorKey: 'caseNo', header: t('disciplinary.fields.caseNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('caseNo')}</span> },
    { id: 'employeeName', header: t('disciplinary.fields.employee'), accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'action', header: t('disciplinary.fields.action'), cell: ({ row }) => <StatusBadge status={row.getValue('action')} /> },
    { accessorKey: 'incidentDate', header: t('disciplinary.fields.incidentDate'), cell: ({ row }) => formatDate(row.getValue('incidentDate')) },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'appealFiled', header: t('disciplinary.appeal.title'), cell: ({ row }) => row.getValue('appealFiled') ? <Badge variant="destructive">{tc('labels.yes')}</Badge> : <Badge variant="outline">{tc('labels.no')}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('disciplinary.title')} description={t('disciplinary.description')}>
        <Button size="sm" onClick={() => router.push('/hr/disciplinary/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('disciplinary.newCase')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={cases}
        searchKey="employeeName"
        searchPlaceholder={t('disciplinary.searchCases')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/disciplinary/${row.id}`)}
      />
    </div>
  )
}
