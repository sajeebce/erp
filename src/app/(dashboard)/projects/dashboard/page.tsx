'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, BarChart3, DollarSign, Users, Activity, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface ProjectPerformance {
  id: string
  projectNo: string
  name: string
  projectType: string
  sector: string
  status: string
  totalBudget: number
  amountSpent: number
  currency: string
  country: string
  progress: number
  burnRate: number
  totalActivities: number
  completedActivities: number
  activityCompletion: number
  totalMilestones: number
  achievedMilestones: number
  teamMembers: number
  indicators: number
  risks: number
  startDate: string
  endDate: string
}

interface DashboardData {
  totalProjects: number
  activeProjects: number
  pipelineProjects: number
  completedProjects: number
  averageProgress: number
  totalBudget: number
  totalSpent: number
  teamMembers: number
  totalActivities: number
  completedActivities: number
  delayedActivities: number
  projectPerformance: ProjectPerformance[]
}

export default function ProjectDashboardPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/projects/dashboard')
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json.data)
      } else {
        setError(json.error || tc('errors.loadFailed'))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('dashboard.title')} />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error || tc('errors.loadFailed')}
          </CardContent>
        </Card>
      </div>
    )
  }

  function burnRateColor(rate: number): string {
    if (rate <= 0) return 'text-muted-foreground'
    if (rate < 50) return 'text-emerald-600 dark:text-emerald-400'
    if (rate < 80) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  function progressBarColor(progress: number): string {
    if (progress >= 75) return 'bg-emerald-500'
    if (progress >= 40) return 'bg-blue-500'
    if (progress >= 10) return 'bg-amber-500'
    return 'bg-slate-400'
  }

  const statCards = [
    {
      label: t('dashboard.activeProjects'),
      value: data.activeProjects,
      icon: Activity,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('dashboard.totalBudget'),
      value: formatCurrency(data.totalBudget),
      icon: DollarSign,
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: t('dashboard.avgProgress'),
      value: `${data.averageProgress}%`,
      icon: BarChart3,
      accent: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: t('dashboard.teamMembers'),
      value: data.teamMembers,
      icon: Users,
      accent: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: t('dashboard.totalActivities'),
      value: data.totalActivities,
      icon: Activity,
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: t('dashboard.completedActivities'),
      value: data.completedActivities,
      icon: CheckCircle2,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('dashboard.delayedActivities'),
      value: data.delayedActivities,
      icon: AlertTriangle,
      accent: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`h-4 w-4 ${card.accent}`} />
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
              </div>
              <p className="text-2xl font-bold font-mono">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.projectPerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.projectPerformance.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('dashboard.noProjects')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">{t('fields.name')}</th>
                    <th className="text-left py-2 pr-4">{t('fields.projectType')}</th>
                    <th className="text-left py-2 pr-4">{t('fields.sector')}</th>
                    <th className="text-left py-2 pr-4">{t('fields.country')}</th>
                    <th className="text-right py-2 pr-4">{t('fields.totalBudget')}</th>
                    <th className="text-right py-2 pr-4">{t('dashboard.spent')}</th>
                    <th className="text-right py-2 pr-4">{t('dashboard.burnRate')}</th>
                    <th className="text-left py-2 pr-4">{t('fields.progress')}</th>
                    <th className="text-center py-2 pr-4">{t('dashboard.activities')}</th>
                    <th className="text-left py-2">{tc('labels.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projectPerformance.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{project.projectNo}</p>
                        </div>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{t(`types.${project.projectType}`)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{t(`sectors.${project.sector}`)}</td>
                      <td className="py-2 pr-4">{project.country || '-'}</td>
                      <td className="py-2 pr-4 text-right font-mono whitespace-nowrap">
                        {formatCurrency(project.totalBudget, project.currency)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono whitespace-nowrap">
                        {formatCurrency(project.amountSpent, project.currency)}
                      </td>
                      <td className={`py-2 pr-4 text-right font-mono whitespace-nowrap ${burnRateColor(project.burnRate)}`}>
                        {project.burnRate}%
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2 min-w-30">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progressBarColor(project.progress)}`}
                              style={{ width: `${Math.min(project.progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-center font-mono whitespace-nowrap">
                        {project.completedActivities}/{project.totalActivities}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={project.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
