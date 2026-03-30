'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Check, FileText, Shield, Monitor,
  Building2, Heart, UserCheck, AlertTriangle, Upload, Paperclip,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  documentType: string | null
}

interface OnboardingTask {
  checklistId: string
  isCompleted: boolean
  completedAt: string | null
  documentId: string | null
  notes: string | null
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

function TaskRow({ task, employeeId, onRefresh, formatDate }: {
  task: OnboardingTask
  employeeId: string
  onRefresh: () => void
  formatDate: (date: string) => string
}) {
  const [uploading, setUploading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(task.notes || '')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleToggle() {
    // If task requires doc and no doc yet, prompt file upload instead
    if (!task.isCompleted && task.checklist.requiresDocument && !task.documentId) {
      fileRef.current?.click()
      return
    }

    await fetch(`/api/v1/hr/onboarding/${employeeId}/tasks/${task.checklistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !task.isCompleted }),
    })
    onRefresh()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Upload the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', 'hr')
      formData.append('entityType', 'onboarding')
      formData.append('entityId', employeeId)

      const uploadRes = await fetch('/api/v1/upload', { method: 'POST', body: formData })
      const uploadJson = await uploadRes.json()

      if (uploadJson.success) {
        // 2. Mark task complete with documentId
        await fetch(`/api/v1/hr/onboarding/${employeeId}/tasks/${task.checklistId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCompleted: true, documentId: uploadJson.data.id }),
        })
        onRefresh()
      }
    } catch {
      // silent
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveNotes() {
    await fetch(`/api/v1/hr/onboarding/${employeeId}/tasks/${task.checklistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes.trim() || null }),
    })
    setShowNotes(false)
    onRefresh()
  }

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />

      <button
        onClick={handleToggle}
        disabled={uploading}
        className={cn(
          "h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5",
          task.isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input hover:border-primary"
        )}
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : task.isCompleted && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium", task.isCompleted && "line-through text-muted-foreground")}>
            {task.checklist.name}
          </p>
          {task.checklist.isRequired && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
          )}
          {task.checklist.requiresDocument && !task.documentId && !task.isCompleted && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 gap-1">
              <Upload className="h-2.5 w-2.5" /> Upload needed
            </Badge>
          )}
          {task.documentId && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 gap-1">
              <Paperclip className="h-2.5 w-2.5" /> Doc attached
            </Badge>
          )}
        </div>

        {task.checklist.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{task.checklist.description}</p>
        )}

        {/* Notes section */}
        {task.notes && !showNotes && (
          <p className="text-xs text-muted-foreground mt-1 italic cursor-pointer hover:text-foreground" onClick={() => setShowNotes(true)}>
            Note: {task.notes}
          </p>
        )}
        {showNotes && (
          <div className="mt-2 flex gap-2">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={1} className="text-xs h-8 min-h-0" placeholder="Add notes..." />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={saveNotes}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowNotes(false)}>Cancel</Button>
          </div>
        )}

        {/* Upload button for doc-required tasks that are not yet completed */}
        {task.checklist.requiresDocument && !task.documentId && !task.isCompleted && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload {task.checklist.documentType?.replace(/_/g, ' ').toLowerCase() || 'document'}
          </Button>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {task.completedAt && (
          <span className="text-xs text-muted-foreground">{formatDate(task.completedAt)}</span>
        )}
        {!showNotes && (
          <button onClick={() => setShowNotes(true)} className="text-xs text-muted-foreground hover:text-foreground">
            {task.notes ? 'Edit note' : '+ Note'}
          </button>
        )}
      </div>
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
  const docsRequired = tasks.filter(t => t.checklist.requiresDocument).length
  const docsUploaded = tasks.filter(t => t.checklist.requiresDocument && t.documentId).length

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {completedTasks} of {totalTasks} tasks completed
                </span>
                {progressPct === 100 ? (
                  <Badge variant="default">Completed</Badge>
                ) : (
                  <span className="text-muted-foreground font-mono">{progressPct}%</span>
                )}
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {docsUploaded} of {docsRequired} documents uploaded
                </span>
                <span className="text-muted-foreground font-mono">
                  {docsRequired > 0 ? Math.round((docsUploaded / docsRequired) * 100) : 100}%
                </span>
              </div>
              <Progress value={docsRequired > 0 ? (docsUploaded / docsRequired) * 100 : 100} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                  employeeId={employeeId}
                  onRefresh={fetchData}
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
