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

interface LeaveApplication {
  id: string
  applicationNo: string
  employee?: { fullName: string }
  employeeName?: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: string
}

export default function LeavePage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<LeaveApplication>[] = [
    { accessorKey: 'applicationNo', header: t('leave.applicationNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('applicationNo')}</span> },
    { id: 'employeeName', header: t('leave.employee'), accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'leaveType', header: t('leave.leaveType'), cell: ({ row }) => <StatusBadge status={row.getValue('leaveType')} /> },
    { accessorKey: 'startDate', header: t('leave.startDate'), cell: ({ row }) => new Date(row.getValue('startDate') as string).toLocaleDateString() },
    { accessorKey: 'endDate', header: t('leave.endDate'), cell: ({ row }) => new Date(row.getValue('endDate') as string).toLocaleDateString() },
    { accessorKey: 'days', header: t('leave.days'), cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('days')}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/leave?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setApplications(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('leave.title')} description={t('leave.description')}>
        <Button size="sm" onClick={() => router.push('/hr/leave/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('leave.applyLeave')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={applications}
        searchKey="employeeName"
        searchPlaceholder={t('leave.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/leave/${row.id}`)}
      />
    </div>
  )
}
