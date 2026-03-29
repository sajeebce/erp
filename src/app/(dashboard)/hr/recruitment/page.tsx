'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Briefcase, Users, Clock, CalendarCheck, Loader2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface JobPosting {
  id: string
  postingNo: string
  title: string
  department: { id: string; name: string } | null
  location: string
  vacancies: number
  applicationDeadline: string
  applicationsCount: number
  status: string
}

interface RecruitmentAnalytics {
  openPositions: number
  totalApplications: number
  avgTimeToHire: number
  interviewsScheduled: number
}

export default function RecruitmentPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [analytics, setAnalytics] = useState<RecruitmentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')

  const columns: ColumnDef<JobPosting>[] = [
    {
      accessorKey: 'postingNo',
      header: t('recruitment.postingNo'),
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('postingNo')}</span>,
    },
    {
      accessorKey: 'title',
      header: t('recruitment.jobTitle'),
      cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
    },
    {
      accessorKey: 'department',
      header: t('fields.department'),
      cell: ({ row }) => {
        const dept = row.original.department
        return <span className="text-sm">{dept?.name || '\u2014'}</span>
      },
    },
    {
      accessorKey: 'location',
      header: t('recruitment.location'),
      cell: ({ row }) => <span className="text-sm">{row.getValue('location') || '\u2014'}</span>,
    },
    {
      accessorKey: 'vacancies',
      header: t('recruitment.vacancies'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('vacancies')}</span>,
    },
    {
      accessorKey: 'applicationDeadline',
      header: t('recruitment.deadline'),
      cell: ({ row }) => {
        const val = row.getValue('applicationDeadline') as string
        return <span className="text-sm">{val ? formatDate(val) : '\u2014'}</span>
      },
    },
    {
      accessorKey: 'applicationsCount',
      header: t('recruitment.applications'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('applicationsCount') ?? 0}</span>,
    },
    {
      accessorKey: 'status',
      header: tc('labels.status'),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/recruitment/jobs?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setJobs(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/v1/hr/recruitment/analytics')
      .then(res => res.json())
      .then(json => { if (json.success) setAnalytics(json.data) })
      .catch(() => {})
  }, [])

  const filteredJobs = activeTab === 'ALL'
    ? jobs
    : jobs.filter(j => j.status === activeTab)

  return (
    <div className="space-y-6">
      <PageHeader title={t('recruitment.title')} description={t('recruitment.description')}>
        <Button size="sm" onClick={() => router.push('/hr/recruitment/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('recruitment.postNewJob')}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recruitment.openPositions')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.openPositions ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t('recruitment.currentlyHiring')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recruitment.totalApplications')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalApplications ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t('recruitment.acrossAllJobs')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recruitment.avgTimeToHire')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgTimeToHire ?? 0} {t('recruitment.days')}</div>
            <p className="text-xs text-muted-foreground">{t('recruitment.averageDuration')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recruitment.interviewsScheduled')}</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.interviewsScheduled ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t('recruitment.upcoming')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status filter tabs + data table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ALL">{tc('labels.all')}</TabsTrigger>
          <TabsTrigger value="DRAFT">{tc('status.DRAFT')}</TabsTrigger>
          <TabsTrigger value="PUBLISHED">{t('recruitment.published')}</TabsTrigger>
          <TabsTrigger value="CLOSED">{tc('status.CLOSED')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable
            columns={columns}
            data={filteredJobs}
            searchKey="title"
            searchPlaceholder={t('recruitment.searchPlaceholder')}
            isLoading={loading}
            onRowClick={(row) => router.push(`/hr/recruitment/${row.id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
