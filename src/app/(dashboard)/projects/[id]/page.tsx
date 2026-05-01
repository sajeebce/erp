'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Trash2, Save, X, CalendarPlus, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const PROJECT_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const
const PROJECT_TYPES = ['HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY'] as const
const PROJECT_SECTORS = ['WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER'] as const
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'SEK', 'NOK', 'DKK', 'BDT', 'INR', 'KES', 'NGN', 'ZAR', 'ETB', 'UGX', 'TZS', 'NPR', 'PKR', 'MMK', 'THB', 'PHP', 'IDR'] as const

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

interface ProjectExtensionRequest {
  id: string
  requestNo: string
  currentStartDate: string | null
  currentEndDate: string
  proposedEndDate: string
  currentBudget: string | number
  reason: string
  impactNotes: string | null
  approvalReference: string | null
  attachmentUrl: string | null
  status: string
  requestedById: string
  requestedAt: string
  approvedById: string | null
  approvedAt: string | null
  approvalNotes: string | null
  rejectedById: string | null
  rejectedAt: string | null
  rejectionReason: string | null
}

interface Employee {
  id: string
  fullName: string
  designation: { id: string; title: string } | null
}

interface CurrentUser {
  role?: { name?: string | null } | null
  employee?: { id: string; fullName: string } | null
}

interface Project {
  id: string
  projectNo: string
  name: string
  description: string | null
  projectType: string | null
  sector: string | null
  currency: string | null
  country: string | null
  region: string | null
  implementingPartner: string | null
  donorId: string | null
  managerId: string | null
  startDate: string | null
  endDate: string | null
  totalBudget: string | number
  amountSpent: string | number
  location: string | null
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  grants: Grant[]
  teamMembers: TeamMember[]
  extensionRequests: ProjectExtensionRequest[]
  _count: {
    activities: number
    milestones: number
    budgets: number
    indicators: number
    risks: number
    logFrameEntries: number
    documents: number
    extensionRequests: number
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

function getApiError(json: { error?: string | { message?: string } } | null, fallback: string) {
  if (!json?.error) return fallback
  return typeof json.error === 'string' ? json.error : json.error.message || fallback
}

function daysBetween(from: string | null, to: string | null): number {
  if (!from || !to) return 0
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000))
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [showExtensionForm, setShowExtensionForm] = useState(false)
  const [extensionSubmitting, setExtensionSubmitting] = useState(false)
  const [extensionActionId, setExtensionActionId] = useState<string | null>(null)
  const [extensionProposedEndDate, setExtensionProposedEndDate] = useState('')
  const [extensionReason, setExtensionReason] = useState('')
  const [extensionImpactNotes, setExtensionImpactNotes] = useState('')
  const [extensionApprovalReference, setExtensionApprovalReference] = useState('')
  const extensionCardRef = useRef<HTMLDivElement | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProjectType, setEditProjectType] = useState('')
  const [editSector, setEditSector] = useState('')
  const [editCurrency, setEditCurrency] = useState('')
  const [editCountry, setEditCountry] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editImplementingPartner, setEditImplementingPartner] = useState('')
  const [editManagerId, setEditManagerId] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTotalBudget, setEditTotalBudget] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editProgress, setEditProgress] = useState('')

  useEffect(() => {
    fetchProject()
    fetchCurrentUser()
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
        setError(getApiError(json, tc('errors.loadFailed')))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/v1/hr/employees?limit=100')
      const json = await res.json()
      if (json.success) setEmployees(json.data)
    } catch {
      // silent fail for employee list
    }
  }

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/v1/auth/me')
      const json = await res.json()
      if (json.success) {
        setCurrentUser(json.data)
        if (json.data.role?.name === 'PROJECT_MANAGER' && json.data.employee) {
          setEmployees([{ id: json.data.employee.id, fullName: json.data.employee.fullName, designation: null }])
        }
      }
    } catch {
      // Role-aware controls fail closed for non-admin actions.
    }
  }

  function startEditing() {
    if (!project) return
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditProjectType(project.projectType || '')
    setEditSector(project.sector || '')
    setEditCurrency(project.currency || '')
    setEditCountry(project.country || '')
    setEditRegion(project.region || '')
    setEditImplementingPartner(project.implementingPartner || '')
    setEditManagerId(project.managerId || '')
    setEditStartDate(toDateInput(project.startDate))
    setEditEndDate(toDateInput(project.endDate))
    setEditTotalBudget(String(project.totalBudget))
    setEditLocation(project.location || '')
    setEditStatus(project.status)
    setEditProgress(String(project.progress))
    setEditing(true)
    fetchEmployees()
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function openExtensionForm() {
    setShowExtensionForm(true)
    setExtensionProposedEndDate('')
    setExtensionReason('')
    setExtensionImpactNotes('')
    setExtensionApprovalReference('')
    window.setTimeout(() => {
      extensionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
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
      projectType: editProjectType || null,
      sector: editSector || null,
      currency: editCurrency || null,
      country: editCountry.trim() || null,
      region: editRegion.trim() || null,
      implementingPartner: editImplementingPartner.trim() || null,
      managerId: editManagerId || null,
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
        setError(getApiError(json, t('form.failedToUpdate')))
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
        setError(getApiError(json, t('form.failedToDelete')))
      }
    } catch {
      setError(t('form.failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreateExtension() {
    if (!extensionProposedEndDate) {
      setError('Proposed end date is required')
      return
    }
    if (!extensionReason.trim()) {
      setError('Extension reason is required')
      return
    }

    setExtensionSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/projects/${id}/extensions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedEndDate: extensionProposedEndDate,
          reason: extensionReason,
          impactNotes: extensionImpactNotes,
          approvalReference: extensionApprovalReference,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setShowExtensionForm(false)
        setExtensionProposedEndDate('')
        setExtensionReason('')
        setExtensionImpactNotes('')
        setExtensionApprovalReference('')
        fetchProject()
      } else {
        setError(getApiError(json, 'Failed to create no-cost extension request'))
      }
    } catch {
      setError('Failed to create no-cost extension request')
    } finally {
      setExtensionSubmitting(false)
    }
  }

  async function handleApproveExtension(extensionId: string) {
    const approvalNotes = window.prompt('Approval notes', 'Approved as no-cost extension. Budget remains unchanged.')
    if (approvalNotes === null) return

    setExtensionActionId(extensionId)
    setError('')

    try {
      const res = await fetch(`/api/v1/projects/${id}/extensions/${extensionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalNotes }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        fetchProject()
      } else {
        setError(getApiError(json, 'Failed to approve extension request'))
      }
    } catch {
      setError('Failed to approve extension request')
    } finally {
      setExtensionActionId(null)
    }
  }

  async function handleRejectExtension(extensionId: string) {
    const rejectionReason = window.prompt('Rejection reason')
    if (!rejectionReason?.trim()) return

    setExtensionActionId(extensionId)
    setError('')

    try {
      const res = await fetch(`/api/v1/projects/${id}/extensions/${extensionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        fetchProject()
      } else {
        setError(getApiError(json, 'Failed to reject extension request'))
      }
    } catch {
      setError('Failed to reject extension request')
    } finally {
      setExtensionActionId(null)
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
  const canRequestExtension = ['ACTIVE', 'ON_HOLD'].includes(project.status) && !!project.endDate
  const canApproveExtensions = currentUser?.role?.name === 'ADMIN'
  const pendingExtension = project.extensionRequests.find((item) => item.status === 'PENDING_APPROVAL')
  const approvedExtensions = project.extensionRequests.filter((item) => item.status === 'APPROVED')
  const firstApprovedExtension = approvedExtensions[approvedExtensions.length - 1]
  const originalEndDate = firstApprovedExtension?.currentEndDate || project.endDate
  const extendedDays = daysBetween(originalEndDate, project.endDate)

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
          {!editing && canRequestExtension && (
            <Button
              variant="outline"
              size="sm"
              onClick={openExtensionForm}
              disabled={!!pendingExtension}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              {pendingExtension ? 'Extension Pending' : 'Request No-Cost Extension'}
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
                  <SearchableSelect
                    id="edit-status"
                    options={PROJECT_STATUSES.map((s) => ({ value: s, label: tc(`status.${s}`) }))}
                    value={editStatus}
                    onValueChange={setEditStatus}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-type">{t('fields.projectType')}</Label>
                  <SearchableSelect
                    id="edit-project-type"
                    options={PROJECT_TYPES.map((pt) => ({ value: pt, label: t(`types.${pt}`) }))}
                    value={editProjectType}
                    onValueChange={setEditProjectType}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sector">{t('fields.sector')}</Label>
                  <SearchableSelect
                    id="edit-sector"
                    options={PROJECT_SECTORS.map((s) => ({ value: s, label: t(`sectors.${s}`) }))}
                    value={editSector}
                    onValueChange={setEditSector}
                  />
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
                  <Input id="edit-budget" type="number" min="0" step="0.01" value={editTotalBudget} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Budget changes require a separate budget revision workflow.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">{t('fields.currency')}</Label>
                  <SearchableSelect
                    id="edit-currency"
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                    value={editCurrency}
                    onValueChange={setEditCurrency}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">{t('fields.progress')} (%)</Label>
                  <Input id="edit-progress" type="number" min="0" max="100" value={editProgress} onChange={(e) => setEditProgress(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-country">{t('fields.country')}</Label>
                  <Input id="edit-country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-region">{t('fields.region')}</Label>
                  <Input id="edit-region" value={editRegion} onChange={(e) => setEditRegion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">{t('fields.location')}</Label>
                  <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-implementing-partner">{t('fields.implementingPartner')}</Label>
                  <Input id="edit-implementing-partner" value={editImplementingPartner} onChange={(e) => setEditImplementingPartner(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-manager">{t('fields.managerId')}</Label>
                  <SearchableSelect
                    id="edit-manager"
                    options={employees.map((emp) => ({
                      value: emp.id,
                      label: emp.fullName,
                      description: emp.designation?.title,
                    }))}
                    value={editManagerId}
                    onValueChange={setEditManagerId}
                  />
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
                <p className="text-sm text-muted-foreground">{t('fields.projectType')}</p>
                <p className="font-medium">{project.projectType ? t(`types.${project.projectType}`) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.sector')}</p>
                <p className="font-medium">{project.sector ? t(`sectors.${project.sector}`) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.country')}</p>
                <p className="font-medium">{project.country || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.region')}</p>
                <p className="font-medium">{project.region || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.location')}</p>
                <p className="font-medium">{project.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('fields.implementingPartner')}</p>
                <p className="font-medium">{project.implementingPartner || '-'}</p>
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
                <p className="text-sm text-muted-foreground">{t('fields.currency')}</p>
                <p className="font-medium">{project.currency || '-'}</p>
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

      {/* No-Cost Extension Workflow */}
      <Card ref={extensionCardRef}>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>No-Cost Extension & Timeline</span>
            <div className="flex items-center gap-2">
              {approvedExtensions.length > 0 && <Badge variant="secondary">Extended</Badge>}
              {pendingExtension && <Badge variant="outline">Pending Approval</Badge>}
              {!pendingExtension && canRequestExtension && (
                <Button size="sm" variant="outline" onClick={openExtensionForm}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Request
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Original End Date</p>
              <p className="font-semibold">{originalEndDate ? formatDate(originalEndDate) : '-'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Current End Date</p>
              <p className="font-semibold">{project.endDate ? formatDate(project.endDate) : '-'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Approved Extensions</p>
              <p className="font-semibold">{approvedExtensions.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Budget Integrity</p>
              <p className="font-semibold text-emerald-700">Budget locked</p>
            </div>
          </div>

          {approvedExtensions.length > 0 && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              Project timeline extended by {extendedDays} day(s). Project budget remains {formatCurrency(Number(project.totalBudget))}.
            </div>
          )}

          {showExtensionForm && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current End Date</p>
                  <p className="font-medium">{project.endDate ? formatDate(project.endDate) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Budget</p>
                  <p className="font-medium font-mono">{formatCurrency(Number(project.totalBudget))}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension-proposed-end-date">Proposed New End Date *</Label>
                  <Input
                    id="extension-proposed-end-date"
                    type="date"
                    value={extensionProposedEndDate}
                    onChange={(e) => setExtensionProposedEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extension-reason">Reason *</Label>
                <Textarea
                  id="extension-reason"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why duration extension is required without additional budget."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extension-impact">Impact Notes</Label>
                  <Textarea
                    id="extension-impact"
                    value={extensionImpactNotes}
                    onChange={(e) => setExtensionImpactNotes(e.target.value)}
                    rows={2}
                    placeholder="Scope, timeline, donor, or field impact."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension-reference">Approval Reference</Label>
                  <Textarea
                    id="extension-reference"
                    value={extensionApprovalReference}
                    onChange={(e) => setExtensionApprovalReference(e.target.value)}
                    rows={2}
                    placeholder="Board memo, donor email, or internal approval reference."
                  />
                </div>
              </div>
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                This is a no-cost extension. The project budget is read-only and will remain unchanged.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExtensionForm(false)} disabled={extensionSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleCreateExtension} disabled={extensionSubmitting}>
                  {extensionSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
                  Submit for Approval
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Request No</th>
                  <th className="text-left py-2 pr-4">Current End</th>
                  <th className="text-left py-2 pr-4">Proposed End</th>
                  <th className="text-right py-2 pr-4">Budget Snapshot</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Reason</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.extensionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No extension requests yet.
                    </td>
                  </tr>
                ) : (
                  project.extensionRequests.map((extension) => (
                    <tr key={extension.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-4 font-mono text-xs">{extension.requestNo}</td>
                      <td className="py-2 pr-4">{formatDate(extension.currentEndDate)}</td>
                      <td className="py-2 pr-4">{formatDate(extension.proposedEndDate)}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatCurrency(Number(extension.currentBudget))}</td>
                      <td className="py-2 pr-4"><StatusBadge status={extension.status} /></td>
                      <td className="py-2 pr-4 max-w-[280px]">
                        <p className="line-clamp-2">{extension.reason}</p>
                        {extension.rejectionReason && <p className="text-xs text-destructive mt-1">Rejected: {extension.rejectionReason}</p>}
                        {extension.approvalNotes && <p className="text-xs text-muted-foreground mt-1">Approved: {extension.approvalNotes}</p>}
                      </td>
                      <td className="py-2 text-right">
                        {extension.status === 'PENDING_APPROVAL' && canApproveExtensions ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectExtension(extension.id)}
                              disabled={extensionActionId === extension.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveExtension(extension.id)}
                              disabled={extensionActionId === extension.id}
                            >
                              {extensionActionId === extension.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.indicators')}</p>
            <p className="text-2xl font-bold">{project._count.indicators}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.risks')}</p>
            <p className="text-2xl font-bold">{project._count.risks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.logFrameEntries')}</p>
            <p className="text-2xl font-bold">{project._count.logFrameEntries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('detail.documents')}</p>
            <p className="text-2xl font-bold">{project._count.documents}</p>
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

      {/* File Attachments */}
      <Card>
        <CardContent className="pt-6">
          <FileUpload entityType="project" entityId={id} module="projects" readOnly={['COMPLETED', 'CLOSED', 'CANCELLED'].includes(project.status)} />
        </CardContent>
      </Card>
    </div>
  )
}
