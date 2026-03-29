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

interface Project {
  id: string
  projectNo: string
  name: string
  projectType: string | null
  sector: string | null
  country: string | null
  region: string | null
  location: string | null
  totalBudget: string | number
  amountSpent: string | number
  currency: string | null
  progress: number
  status: string
  implementingPartner: string | null
  _count: {
    teamMembers: number
    activities: number
    milestones: number
    indicators: number
    risks: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'projectNo',
      header: t('fields.projectNo'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.getValue('projectNo')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: t('fields.name'),
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'projectType',
      header: t('fields.projectType'),
      cell: ({ row }) => {
        const val = row.getValue('projectType') as string | null
        return val ? t(`types.${val}`) : '-'
      },
    },
    {
      accessorKey: 'sector',
      header: t('fields.sector'),
      cell: ({ row }) => {
        const val = row.getValue('sector') as string | null
        return val ? t(`sectors.${val}`) : '-'
      },
    },
    {
      accessorKey: 'country',
      header: t('fields.country'),
      cell: ({ row }) => (row.getValue('country') as string) || '-',
    },
    {
      accessorKey: 'location',
      header: t('fields.location'),
      cell: ({ row }) => (row.getValue('location') as string) || '-',
    },
    {
      accessorKey: 'totalBudget',
      header: t('fields.totalBudget'),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalBudget')))}</span>
      ),
    },
    {
      accessorKey: 'progress',
      header: t('fields.progress'),
      cell: ({ row }) => {
        const value = Number(row.getValue('progress'))
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
            <span className="text-sm font-mono w-10">{value}%</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: tc('labels.status'),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
  ]

  useEffect(() => {
    fetch('/api/v1/projects?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProjects(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={() => router.push('/projects/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addProject')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/projects/${row.id}`)}
      />
    </div>
  )
}
