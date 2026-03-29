'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Offboarding {
  id: string
  offboardingNo: string
  employeeName?: string
  employee?: { fullName: string }
  separationType: string
  lastWorkingDay: string
  tasksCompleted?: number
  tasksTotal?: number
  status: string
}

export default function OffboardingPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatDate } = useFormatters()

  const [records, setRecords] = useState<Offboarding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/offboarding?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setRecords(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const inProgress = records.filter(r => r.status === 'IN_PROGRESS')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = records.filter(r => r.status === 'COMPLETED' && new Date(r.lastWorkingDay) >= startOfMonth)
  const pendingSettlement = records.filter(r => r.status === 'PENDING_SETTLEMENT')

  const columns: ColumnDef<Offboarding>[] = [
    { accessorKey: 'offboardingNo', header: t('offboarding.fields.offboardingNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('offboardingNo')}</span> },
    { id: 'employeeName', header: t('offboarding.fields.employee'), accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'separationType', header: t('offboarding.fields.separationType'), cell: ({ row }) => <StatusBadge status={row.getValue('separationType')} /> },
    { accessorKey: 'lastWorkingDay', header: t('offboarding.fields.lastWorkingDay'), cell: ({ row }) => formatDate(row.getValue('lastWorkingDay')) },
    { id: 'taskProgress', header: t('offboarding.fields.taskProgress'), accessorFn: (row) => `${row.tasksCompleted || 0}/${row.tasksTotal || 0}`, cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('offboarding.title')} description={t('offboarding.description')}>
        <Button size="sm" onClick={() => router.push('/hr/offboarding/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('offboarding.initiateExit')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('offboarding.inProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgress.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('offboarding.completedThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedThisMonth.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('offboarding.pendingSettlement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pendingSettlement.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('offboarding.totalExits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={records}
        searchKey="employeeName"
        searchPlaceholder={t('offboarding.searchOffboarding')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/offboarding/${row.id}`)}
      />
    </div>
  )
}
