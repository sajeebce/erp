'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Check, FileText, Shield, Monitor,
  Building2, Heart, UserCheck, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { cn } from '@/lib/utils'

interface OnboardingChecklist {
  name: string
  description: string | null
  category: string
  isRequired: boolean
  requiresDocument: boolean
}

interface OnboardingTask {
  checklistId: string
  isCompleted: boolean
  completedAt: string | null
  documentId: string | null
  checklist: OnboardingChecklist
}

interface OnboardingDetail {
  employeeId: string
  fullName: string
  department: string
  designation: string
  joiningDate: string
  employmentType: string
  tasks: OnboardingTask[]
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  DOCUMENT: { label: 'Required Documents', icon: FileText },
  FINANCE: { label: 'Financial Setup', icon: Building2 },
  LEGAL: { label: 'Legal & Contracts', icon: Shield },
  COMPLIANCE: { label: 'Compliance & Training', icon: UserCheck },
  IT: { label: 'IT & Systems', icon: Monitor },
  ADMIN: { label: 'Administrative', icon: Building2 },
  HR: { label: 'HR & Orientation', icon: Heart },
  SECURITY: { label: 'Security', icon: AlertTriangle },
}

function TaskRow({ task, onToggle, formatDate }: {
  task: OnboardingTask
  onToggle: (checklistId: string, completed: boolean) => void
  formatDate: (date: string) => string
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <button
        onClick={() => onToggle(task.checklistId, !task.isCompleted)}
        className={cn(
          "h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
          task.isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input hover:border-primary"
        )}
      >
        {task.isCompleted && <Check className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", task.isCompleted && "line-through text-muted-foreground")}>
            {task.checklist.name}
          </p>
          {task.checklist.isRequired && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
          )}
          {task.checklist.requiresDocument && !task.documentId && !task.isCompleted && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">Doc needed</Badge>
          )}
        </div>
        {task.checklist.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{task.checklist.description}</p>
        )}
      </div>
      {task.completedAt && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDate(task.completedAt)}
        </span>
      )}
    </div>
  )
}

export default function OnboardingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const employeeId = params.employeeId as string

  const [detail, setDetail] = useState<OnboardingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function fetchData() {
    fetch(`/api/v1/hr/onboarding/${employeeId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setDetail(json.data)
        else setError(tc('errors.notFound'))
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!employeeId) return
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  async function handleToggle(checklistId: string, completed: boolean) {
    const res = await fetch(`/api/v1/hr/onboarding/${employeeId}/tasks/${checklistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: completed }),
    })
    if (res.ok) {
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('onboarding.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/onboarding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const tasks = detail.tasks
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.isCompleted).length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Group tasks by category
  const grouped = tasks.reduce((acc, task) => {
    const cat = task.checklist.category || 'HR'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(task)
    return acc
  }, {} as Record<string, OnboardingTask[]>)

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.fullName}
        description={t('onboarding.taskChecklist')}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/onboarding')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('fields.fullName')}</span>
              <p className="font-medium">{detail.fullName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('fields.department')}</span>
              <p className="font-medium">{detail.department}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('fields.designation')}</span>
              <p className="font-medium">{detail.designation}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('fields.joiningDate')}</span>
              <p className="font-medium">{formatDate(detail.joiningDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('fields.employmentType')}</span>
              <StatusBadge status={detail.employmentType} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {completedTasks} of {totalTasks} tasks completed ({progressPct}%)
              </span>
              {progressPct === 100 && (
                <Badge variant="default">Completed</Badge>
              )}
            </div>
            <Progress value={progressPct} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Task Checklist by Category */}
      {Object.entries(grouped).map(([category, categoryTasks]) => {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.HR
        const Icon = config.icon
        const catCompletedCount = categoryTasks.filter(t => t.isCompleted).length

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{config.label}</CardTitle>
                </div>
                <Badge variant="outline">{catCompletedCount}/{categoryTasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryTasks.map(task => (
                <TaskRow
                  key={task.checklistId}
                  task={task}
                  onToggle={handleToggle}
                  formatDate={formatDate}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
