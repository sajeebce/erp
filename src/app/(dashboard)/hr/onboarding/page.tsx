'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface OnboardingEmployee {
  employeeId: string
  fullName: string
  department: string
  designation: string
  joiningDate: string
  totalTasks: number
  completedTasks: number
  status: string
}

function deriveStatus(emp: OnboardingEmployee): string {
  if (emp.totalTasks > 0 && emp.completedTasks >= emp.totalTasks) return 'Completed'
  const joining = new Date(emp.joiningDate)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  if (joining < thirtyDaysAgo && emp.completedTasks < emp.totalTasks) return 'Overdue'
  return 'In Progress'
}

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [employees, setEmployees] = useState<OnboardingEmployee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/onboarding')
      .then(res => res.json())
      .then(json => {
        if (json.success) setEmployees(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const enriched = employees.map(emp => ({
    ...emp,
    derivedStatus: emp.status || deriveStatus(emp),
  }))

  const totalNew = enriched.length
  const completed = enriched.filter(e => e.derivedStatus === 'Completed').length
  const inProgress = enriched.filter(e => e.derivedStatus === 'In Progress').length
  const overdue = enriched.filter(e => e.derivedStatus === 'Overdue').length

  const columns: ColumnDef<(typeof enriched)[number]>[] = [
    {
      accessorKey: 'fullName',
      header: t('onboarding.employeeName'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName}</span>
      ),
    },
    {
      accessorKey: 'department',
      header: t('fields.department'),
    },
    {
      accessorKey: 'designation',
      header: t('fields.designation'),
    },
    {
      accessorKey: 'joiningDate',
      header: t('fields.joiningDate'),
      cell: ({ row }) => formatDate(row.original.joiningDate),
    },
    {
      id: 'progress',
      header: t('onboarding.tasksProgress'),
      cell: ({ row }) => {
        const emp = row.original
        const pct = emp.totalTasks > 0 ? (emp.completedTasks / emp.totalTasks) * 100 : 0
        return (
          <div className="space-y-1 min-w-30">
            <Progress value={pct} className="h-2" />
            <span className="text-xs text-muted-foreground">
              {emp.completedTasks}/{emp.totalTasks} tasks
            </span>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: tc('labels.status'),
      cell: ({ row }) => <StatusBadge status={row.original.derivedStatus} />,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('onboarding.title')}
        description={t('onboarding.description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('onboarding.newEmployees')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalNew}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('onboarding.completed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('onboarding.inProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('onboarding.overdue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overdue}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={enriched}
        searchKey="fullName"
        searchPlaceholder={t('onboarding.searchPlaceholder')}
        onRowClick={(row) => router.push(`/hr/onboarding/${row.employeeId}`)}
      />
    </div>
  )
}
