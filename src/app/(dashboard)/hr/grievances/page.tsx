'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Grievance {
  id: string
  grievanceNo: string
  subject: string
  category: string
  severity: string
  status: string
  createdAt: string
}

function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'CRITICAL': return 'destructive'
    case 'HIGH': return 'destructive'
    case 'MEDIUM': return 'secondary'
    case 'LOW': return 'outline'
    default: return 'secondary'
  }
}

export default function GrievancesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatDate } = useFormatters()

  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/grievances?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setGrievances(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openCases = grievances.filter(g => g.status === 'OPEN' || g.status === 'SUBMITTED')
  const underInvestigation = grievances.filter(g => g.status === 'INVESTIGATING' || g.status === 'UNDER_INVESTIGATION')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const resolvedThisMonth = grievances.filter(g => g.status === 'RESOLVED' && new Date(g.createdAt) >= startOfMonth)
  const criticalSeverity = grievances.filter(g => g.severity === 'CRITICAL')

  const columns: ColumnDef<Grievance>[] = [
    { accessorKey: 'grievanceNo', header: t('grievances.fields.grievanceNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('grievanceNo')}</span> },
    { accessorKey: 'subject', header: t('grievances.fields.subject'), cell: ({ row }) => <span className="font-medium">{row.getValue('subject')}</span> },
    { accessorKey: 'category', header: t('grievances.fields.category'), cell: ({ row }) => <StatusBadge status={row.getValue('category')} /> },
    { accessorKey: 'severity', header: t('grievances.fields.severity'), cell: ({ row }) => <Badge variant={getSeverityVariant(row.getValue('severity'))}>{t(`grievances.severities.${row.getValue('severity')}`)}</Badge> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'createdAt', header: t('grievances.fields.createdAt'), cell: ({ row }) => formatDate(row.getValue('createdAt')) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('grievances.title')} description={t('grievances.description')}>
        <Button size="sm" onClick={() => router.push('/hr/grievances/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('grievances.reportGrievance')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.openCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openCases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.underInvestigation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{underInvestigation.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.resolvedThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{resolvedThisMonth.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('grievances.criticalSeverity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{criticalSeverity.length}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={grievances}
        searchKey="subject"
        searchPlaceholder={t('grievances.searchGrievances')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/grievances/${row.id}`)}
      />
    </div>
  )
}
