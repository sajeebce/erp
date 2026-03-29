'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CalendarPlus, CalendarDays, Loader2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Interview {
  id: string
  applicationId: string
  applicantName: string
  jobTitle: string
  interviewType: string
  scheduledAt: string
  duration: number
  location: string | null
  status: string
  rating: number | null
  interviewerName: string | null
}

interface GroupedInterviews {
  date: string
  interviews: Interview[]
}

export default function InterviewsPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')

  const columns: ColumnDef<Interview>[] = [
    {
      accessorKey: 'applicantName',
      header: t('recruitment.applicantName'),
      cell: ({ row }) => <span className="font-medium">{row.getValue('applicantName')}</span>,
    },
    {
      accessorKey: 'jobTitle',
      header: t('recruitment.jobTitle'),
      cell: ({ row }) => <span className="text-sm">{row.getValue('jobTitle')}</span>,
    },
    {
      accessorKey: 'interviewType',
      header: t('recruitment.interviewType'),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {t(`recruitment.interviewTypes.${row.getValue('interviewType')}`)}
        </Badge>
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: t('recruitment.scheduledDate'),
      cell: ({ row }) => {
        const val = row.getValue('scheduledAt') as string
        if (!val) return '\u2014'
        const date = new Date(val)
        return (
          <span className="text-sm">
            {formatDate(val)} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      accessorKey: 'duration',
      header: t('recruitment.duration'),
      cell: ({ row }) => <span className="text-sm font-mono">{row.getValue('duration')} {t('recruitment.minutes')}</span>,
    },
    {
      accessorKey: 'location',
      header: t('recruitment.location'),
      cell: ({ row }) => <span className="text-sm">{row.getValue('location') || '\u2014'}</span>,
    },
    {
      accessorKey: 'interviewerName',
      header: t('recruitment.interviewer'),
      cell: ({ row }) => <span className="text-sm">{row.getValue('interviewerName') || '\u2014'}</span>,
    },
    {
      accessorKey: 'status',
      header: tc('labels.status'),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'rating',
      header: t('recruitment.rating'),
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number | null
        return rating != null ? <Badge variant="secondary">{rating}/5</Badge> : <span className="text-muted-foreground">\u2014</span>
      },
    },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/recruitment/interviews?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setInterviews(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function groupByDate(): GroupedInterviews[] {
    const groups: Record<string, Interview[]> = {}
    interviews.forEach(interview => {
      const dateKey = interview.scheduledAt ? interview.scheduledAt.split('T')[0] : 'unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(interview)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, interviews]) => ({ date, interviews }))
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const grouped = groupByDate()

  return (
    <div className="space-y-6">
      <PageHeader title={t('recruitment.interviewSchedule')} description={t('recruitment.interviewScheduleDesc')}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')}>
            <CalendarDays className="h-4 w-4 mr-2" />
            {viewMode === 'calendar' ? t('recruitment.tableView') : t('recruitment.calendarView')}
          </Button>
        </div>
      </PageHeader>

      {viewMode === 'calendar' ? (
        /* Calendar-style grouped view */
        <div className="space-y-6">
          {grouped.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {t('recruitment.noInterviews')}
              </CardContent>
            </Card>
          ) : (
            grouped.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{formatDate(group.date)}</h3>
                  <Badge variant="secondary" className="text-[10px]">{group.interviews.length}</Badge>
                </div>
                <div className="space-y-2 ml-7">
                  {group.interviews.map(interview => (
                    <Card
                      key={interview.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/hr/recruitment/applications/${interview.applicationId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{interview.applicantName}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {t(`recruitment.interviewTypes.${interview.interviewType}`)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{interview.jobTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(interview.scheduledAt)} &middot; {interview.duration} {t('recruitment.minutes')}
                              {interview.location ? ` &middot; ${interview.location}` : ''}
                            </p>
                            {interview.interviewerName && (
                              <p className="text-xs text-muted-foreground">
                                {t('recruitment.interviewer')}: {interview.interviewerName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {interview.rating != null && (
                              <Badge variant="secondary">{interview.rating}/5</Badge>
                            )}
                            <StatusBadge status={interview.status} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table view */
        <DataTable
          columns={columns}
          data={interviews}
          searchKey="applicantName"
          searchPlaceholder={t('recruitment.searchInterviews')}
          isLoading={loading}
          onRowClick={(row) => router.push(`/hr/recruitment/applications/${row.applicationId}`)}
        />
      )}
    </div>
  )
}
