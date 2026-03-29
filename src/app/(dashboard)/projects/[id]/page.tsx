'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const PROJECT_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const

interface Grant {
  id: string
  grantNo: string
  title: string
  awardAmount: string | number
  disbursedAmount: string | number
  currencyCode: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface TeamMember {
  id: string
  role: string
  startDate: string | null
  endDate: string | null
  allocation: number
  employee: {
    id: string
    fullName: string
    designation: { id: string; title: string } | null
  }
}

interface Project {
  id: string
  projectNo: string
  name: string
  description: string | null
  donorId: string | null
  startDate: string | null
  endDate: string | null
  totalBudget: string | number
  amountSpent: string | number
  location: string | null
  status: string
  progress: number
  managerId: string | null
  createdAt: string
  updatedAt: string
  grants: Grant[]
  teamMembers: TeamMember[]
  _count: {
    activities: number
    milestones: number
    budgets: number
  }
  budgetSummary: {
    totalBudgeted: number
    budgetCount: number
  }
}

function toDateInput(val: string | null): string {
  if (!val) return ''
  return new Date(val).toISOString().split('T')[0]
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTotalBudget, setEditTotalBudget] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editProgress, setEditProgress] = useState('')

  useEffect(() => {
    fetchProject()
  }, [id])

  async function fetchProject() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setProject(json.data)
      } else {
        setError(json.error || tc('errors.loadFailed'))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function startEditing() {
    if (!project) return
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditStartDate(toDateInput(project.startDate))
    setEditEndDate(toDateInput(project.endDate))
    setEditTotalBudget(String(project.totalBudget))
    setEditLocation(project.location || '')
    setEditStatus(project.status)
    setEditProgress(String(project.progress))
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!editName.trim()) {
      setError(t('form.nameRequired'))
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: editName.trim(),
      description: editDescription.trim() || null,
      startDate: editStartDate || null,
      endDate: editEndDate || null,
      totalBudget: Number(editTotalBudget) || 0,
      location: editLocation.trim() || null,
      status: editStatus,
      progress: Number(editProgress) || 0,
    }

    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        fetchProject()
      } else {
        setError(json.error || t('form.failedToUpdate'))
      }
    } catch {
      setError(t('form.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(t('form.confirmDelete'))) return

    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/projects')
      } else {
        const json = await res.json()
        setError(json.error || t('form.failedToDelete'))
      }
    } catch {
      setError(t('form.failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('detail.title')}>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = ['PIPELINE', 'ACTIVE', 'ON_HOLD'].includes(project.status)
  const canDelete = project.status === 'PIPELINE'

  return (
    <div className="space-y-6">
      <PageHeader title={project.name} description={`${project.projectNo}`}>
        <div className="flex items-center gap-2">
          {!editing && canEdit && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          )}
          {!editing && canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {tc('buttons.delete')}
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {tc('buttons.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {tc('buttons.save')}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {t('form.projectInfo')}
            <StatusBadge status={project.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('fields.name')} *</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t('fields.status')}</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{tc(`status.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('fields.description')}</Label>
                <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">{t('fields.startDate')}</Label>
                  <Input id="edit-start-date" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">{t('fields.endDate')}</Label>
                  <Input id="edit-end-date" type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-budget">{t('fields.totalBudget')}</Label>
                  <Input id="edit-budget" type="number" min="0" step="0.01" value={editTotalBudget} onChange={(e) => setEditTotalBudget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">{t('fields.location')}</Label>
                  <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">{t('fields.progress')} (%)</Label>
                  <Input id="edit-progress" type="number" min="0" max="100" value={editProgress} onChange={(e) => setEditProgress(e.target.value)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.name')}</p>
                <p className="font-medium">{project.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.location')}</p>
                <p className="font-medium">{project.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.progress')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(project.progress, 100)}%` }} />
                  </div>
                  <span className="text-sm font-mono">{project.progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.startDate')}</p>
                <p className="font-medium">{project.startDate ? formatDate(project.startDate) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.endDate')}</p>
                <p className="font-medium">{project.endDate ? formatDate(project.endDate) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.totalBudget')}</p>
                <p className="font-medium font-mono">{formatCurrency(Number(project.totalBudget))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('detail.amountSpent')}</p>
                <p className="font-medium font-mono">{formatCurrency(Number(project.amountSpent))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tc('labels.createdAt')}</p>
                <p className="font-medium">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tc('labels.updatedAt')}</p>
                <p className="font-medium">{formatDate(project.updatedAt)}</p>
              </div>
              {project.description && (
                <div className="col-span-full">
                  <p className="text-sm text-muted-foreground">{t('fields.description')}</p>
                  <p className="font-medium whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.activities')}</p>
            <p className="text-2xl font-bold">{project._count.activities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.milestones')}</p>
            <p className="text-2xl font-bold">{project._count.milestones}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.budgetLines')}</p>
            <p className="text-2xl font-bold">{project._count.budgets}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grants */}
      {project.grants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.grants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">{t('detail.grantNo')}</th>
                    <th className="text-left py-2 pr-4">{t('detail.grantTitle')}</th>
                    <th className="text-right py-2 pr-4">{t('detail.awardAmount')}</th>
                    <th className="text-right py-2 pr-4">{t('detail.disbursed')}</th>
                    <th className="text-left py-2">{tc('labels.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {project.grants.map((grant) => (
                    <tr key={grant.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{grant.grantNo}</td>
                      <td className="py-2 pr-4">{grant.title}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatCurrency(Number(grant.awardAmount))}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatCurrency(Number(grant.disbursedAmount))}</td>
                      <td className="py-2"><StatusBadge status={grant.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Attachments */}
      <Card>
        <CardContent className="pt-6">
          <FileUpload entityType="project" entityId={id} module="projects" readOnly={['COMPLETED', 'CLOSED', 'CANCELLED'].includes(project.status)} />
        </CardContent>
      </Card>

      {/* Team Members */}
      {project.teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.teamMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">{t('detail.memberName')}</th>
                    <th className="text-left py-2 pr-4">{t('detail.designation')}</th>
                    <th className="text-left py-2 pr-4">{t('detail.role')}</th>
                    <th className="text-right py-2">{t('detail.allocation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {project.teamMembers.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{member.employee.fullName}</td>
                      <td className="py-2 pr-4">{member.employee.designation?.title || '-'}</td>
                      <td className="py-2 pr-4">{member.role}</td>
                      <td className="py-2 text-right font-mono">{member.allocation}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
