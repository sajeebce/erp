'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface OffboardingTask {
  id: string
  taskName: string
  category: string
  assignee?: string | null
  isCompleted: boolean
  completedAt?: string | null
}

interface Settlement {
  leaveEncashment?: number
  gratuity?: number
  otherPayments?: number
  deductions?: number
  netSettlement?: number
}

interface ExitInterview {
  date?: string | null
  interviewer?: string | null
  notes?: string | null
  exitReason?: string | null
  wouldRehire?: boolean
}

interface Offboarding {
  id: string
  offboardingNo: string
  employeeId: string
  employee?: { id: string; employeeNo: string; fullName: string; department?: { name: string } }
  separationType: string
  lastWorkingDay: string
  noticeDate?: string | null
  noticePeriodDays?: number | null
  notes?: string | null
  status: string
  tasks?: OffboardingTask[]
  settlement?: Settlement | null
  exitInterview?: ExitInterview | null
  createdAt: string
}

export default function OffboardingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [record, setRecord] = useState<Offboarding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [settlementLoading, setSettlementLoading] = useState(false)

  // Exit interview form
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [exitReason, setExitReason] = useState('')
  const [wouldRehire, setWouldRehire] = useState(false)
  const [interviewSaving, setInterviewSaving] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/offboarding/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setRecord(json.data)
          if (json.data.exitInterview) {
            const ei = json.data.exitInterview
            setInterviewDate(ei.date?.split('T')[0] || '')
            setInterviewer(ei.interviewer || '')
            setInterviewNotes(ei.notes || '')
            setExitReason(ei.exitReason || '')
            setWouldRehire(ei.wouldRehire || false)
          }
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function toggleTask(taskId: string, isCompleted: boolean) {
    try {
      const res = await fetch(`/api/v1/hr/offboarding/${params.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRecord(prev => {
          if (!prev) return prev
          const tasks = (prev.tasks || []).map(task =>
            task.id === taskId ? { ...task, isCompleted, completedAt: isCompleted ? new Date().toISOString() : null } : task
          )
          return { ...prev, tasks }
        })
      }
    } catch {
      // Silent fail for task toggle
    }
  }

  async function calculateSettlement() {
    setSettlementLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/offboarding/${params.id}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRecord(prev => prev ? { ...prev, settlement: json.data } : prev)
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    } finally {
      setSettlementLoading(false)
    }
  }

  async function saveExitInterview() {
    setInterviewSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/offboarding/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exitInterview: {
            date: interviewDate || null,
            interviewer: interviewer.trim() || null,
            notes: interviewNotes.trim() || null,
            exitReason: exitReason.trim() || null,
            wouldRehire,
          },
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRecord(prev => prev ? { ...prev, exitInterview: json.data.exitInterview } : prev)
      } else {
        setError(json.error || t('form.failedToSave'))
      }
    } catch {
      setError(t('form.failedToSave'))
    } finally {
      setInterviewSaving(false)
    }
  }

  async function completeExit() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/offboarding/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRecord(prev => prev ? { ...prev, status: 'COMPLETED' } : prev)
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('offboarding.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/offboarding')}>
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

  const tasks = record.tasks || []
  const completedTasks = tasks.filter(task => task.isCompleted).length
  const allTasksDone = tasks.length > 0 && completedTasks === tasks.length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('offboarding.fields.offboardingNo')}: ${record.offboardingNo}`}
        description={record.employee?.fullName || ''}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/offboarding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {allTasksDone && record.status !== 'COMPLETED' && (
            <Button size="sm" onClick={completeExit} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {t('offboarding.completeExit')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Employee Info & Separation Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('offboarding.fields.employee')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('fields.fullName')}:</span> <span className="font-medium">{record.employee?.fullName || '\u2014'}</span></div>
            {record.employee?.employeeNo && <div><span className="text-muted-foreground">{t('fields.employeeNo')}:</span> <span className="font-mono text-xs">{record.employee.employeeNo}</span></div>}
            {record.employee?.department?.name && <div><span className="text-muted-foreground">{t('fields.department')}:</span> {record.employee.department.name}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('offboarding.form.exitDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('offboarding.fields.offboardingNo')}:</span> <span className="font-mono font-medium">{record.offboardingNo}</span></div>
            <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={record.status} /></div>
            <div><span className="text-muted-foreground">{t('offboarding.fields.separationType')}:</span> <StatusBadge status={record.separationType} /></div>
            <div><span className="text-muted-foreground">{t('offboarding.fields.lastWorkingDay')}:</span> {formatDate(record.lastWorkingDay)}</div>
            {record.noticeDate && <div><span className="text-muted-foreground">Notice Date:</span> {formatDate(record.noticeDate)}</div>}
            {record.noticePeriodDays != null && <div><span className="text-muted-foreground">Notice Period:</span> {record.noticePeriodDays} days</div>}
          </CardContent>
        </Card>
      </div>

      {/* Task Checklist */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('offboarding.tasks.title')}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedTasks} {t('offboarding.tasks.of')} {tasks.length} {t('offboarding.tasks.completed')}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task.id, !task.isCompleted)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={record.status === 'COMPLETED'}
                  />
                  <div className="flex-1">
                    <p className={cn("font-medium text-sm", task.isCompleted && "line-through text-muted-foreground")}>
                      {task.taskName}
                    </p>
                    {task.assignee && <p className="text-xs text-muted-foreground">{task.assignee}</p>}
                  </div>
                  <Badge variant="outline">{task.category}</Badge>
                  {task.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.completedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Interview */}
      <Card>
        <CardHeader><CardTitle>{t('offboarding.exitInterview.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview-date">{t('offboarding.exitInterview.date')}</Label>
              <Input id="interview-date" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} disabled={record.status === 'COMPLETED'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewer">{t('offboarding.exitInterview.interviewer')}</Label>
              <Input id="interviewer" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} disabled={record.status === 'COMPLETED'} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit-reason">{t('offboarding.exitInterview.exitReason')}</Label>
            <Input id="exit-reason" value={exitReason} onChange={(e) => setExitReason(e.target.value)} disabled={record.status === 'COMPLETED'} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-notes">{t('offboarding.exitInterview.notes')}</Label>
            <Textarea id="interview-notes" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} rows={3} disabled={record.status === 'COMPLETED'} />
          </div>

          <div className="flex items-center gap-2">
            <input id="would-rehire" type="checkbox" checked={wouldRehire} onChange={(e) => setWouldRehire(e.target.checked)} className="h-4 w-4 rounded border-gray-300" disabled={record.status === 'COMPLETED'} />
            <Label htmlFor="would-rehire">{t('offboarding.exitInterview.wouldRehire')}</Label>
          </div>

          {record.status !== 'COMPLETED' && (
            <div className="flex justify-end">
              <Button size="sm" onClick={saveExitInterview} disabled={interviewSaving}>
                {interviewSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {tc('buttons.save')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Settlement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('offboarding.settlement.title')}</CardTitle>
            {!record.settlement && record.status !== 'COMPLETED' && (
              <Button size="sm" variant="outline" onClick={calculateSettlement} disabled={settlementLoading}>
                {settlementLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('offboarding.settlement.calculate')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {record.settlement ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span>{t('offboarding.settlement.leaveEncashment')}</span>
                <span className="font-mono">{formatCurrency(record.settlement.leaveEncashment || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>{t('offboarding.settlement.gratuity')}</span>
                <span className="font-mono">{formatCurrency(record.settlement.gratuity || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>{t('offboarding.settlement.otherPayments')}</span>
                <span className="font-mono">{formatCurrency(record.settlement.otherPayments || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-destructive">
                <span>{t('offboarding.settlement.deductions')}</span>
                <span className="font-mono">-{formatCurrency(record.settlement.deductions || 0)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-base">
                <span>{t('offboarding.settlement.netSettlement')}</span>
                <span className="font-mono">{formatCurrency(record.settlement.netSettlement || 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {tc('labels.noData')}
            </p>
          )}
        </CardContent>
      </Card>

      {record.notes && (
        <Card>
          <CardHeader><CardTitle>{tc('labels.notes')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{record.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
