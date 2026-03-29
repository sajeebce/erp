'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const MILESTONE_STATUSES = ['ON_TRACK', 'ACHIEVED', 'AT_RISK', 'OVERDUE', 'CANCELLED'] as const

interface Project {
  id: string
  name: string
  projectNo: string
}

interface Milestone {
  id: string
  milestoneNo?: string
  description: string
  projectId: string
  project?: { id: string; name: string; projectNo: string }
  targetDate: string
  actualDate: string | null
  deliverable: string | null
  status: string
  notes: string | null
}

function toDateInput(val: string | null | undefined): string {
  if (!val) return ''
  return new Date(val).toISOString().split('T')[0]
}

export default function MilestonesPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  // Data
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterProjectId, setFilterProjectId] = useState('')

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addDescription, setAddDescription] = useState('')
  const [addProjectId, setAddProjectId] = useState('')
  const [addTargetDate, setAddTargetDate] = useState('')
  const [addDeliverable, setAddDeliverable] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTargetDate, setEditTargetDate] = useState('')
  const [editActualDate, setEditActualDate] = useState('')
  const [editDeliverable, setEditDeliverable] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchMilestones()
  }, [filterProjectId])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/v1/projects?limit=100')
      const json = await res.json()
      if (res.ok && json.success) {
        setProjects(json.data || [])
      }
    } catch {
      // silent
    }
  }

  async function fetchMilestones() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterProjectId) params.set('projectId', filterProjectId)
      const res = await fetch(`/api/v1/projects/milestones?${params}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setMilestones(json.data || [])
      } else {
        setError(json.error || tc('errors.loadFailed'))
      }
    } catch {
      setError(tc('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setAddDescription('')
    setAddProjectId(filterProjectId)
    setAddTargetDate('')
    setAddDeliverable('')
    setError('')
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!addDescription.trim() || !addTargetDate) {
      setError(tc('errors.requiredFields'))
      return
    }

    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/v1/projects/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: addDescription.trim(),
          projectId: addProjectId || undefined,
          targetDate: addTargetDate,
          deliverable: addDeliverable.trim() || null,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setAddOpen(false)
        fetchMilestones()
      } else {
        setError(json.error || tc('errors.saveFailed'))
      }
    } catch {
      setError(tc('errors.saveFailed'))
    } finally {
      setAdding(false)
    }
  }

  function openEdit(m: Milestone) {
    setEditId(m.id)
    setEditDescription(m.description)
    setEditTargetDate(toDateInput(m.targetDate))
    setEditActualDate(toDateInput(m.actualDate))
    setEditDeliverable(m.deliverable || '')
    setEditStatus(m.status)
    setEditNotes(m.notes || '')
    setError('')
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editDescription.trim() || !editTargetDate) {
      setError(tc('errors.requiredFields'))
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/milestones/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription.trim(),
          targetDate: editTargetDate,
          actualDate: editActualDate || null,
          deliverable: editDeliverable.trim() || null,
          status: editStatus,
          notes: editNotes.trim() || null,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditOpen(false)
        fetchMilestones()
      } else {
        setError(json.error || tc('errors.saveFailed'))
      }
    } catch {
      setError(tc('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  // Summary stats
  const total = milestones.length
  const achieved = milestones.filter((m) => m.status === 'ACHIEVED').length
  const onTrack = milestones.filter((m) => m.status === 'ON_TRACK').length
  const atRiskOverdue = milestones.filter((m) => m.status === 'AT_RISK' || m.status === 'OVERDUE').length

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: `${p.projectNo} — ${p.name}`,
  }))

  const statusOptions = MILESTONE_STATUSES.map((s) => ({
    value: s,
    label: tc(`status.${s}`),
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t('milestones.title')} description={t('milestones.description')}>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('milestones.addMilestone')}
        </Button>
      </PageHeader>

      {/* Project filter */}
      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
          <SearchableSelect
            options={[{ value: '', label: tc('filters.all') }, ...projectOptions]}
            value={filterProjectId}
            onValueChange={setFilterProjectId}
            placeholder={t('milestones.selectProject')}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('milestones.totalMilestones')}</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('milestones.achieved')}</p>
            <p className="text-2xl font-bold text-emerald-600">{achieved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('milestones.onTrack')}</p>
            <p className="text-2xl font-bold text-blue-600">{onTrack}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('milestones.atRiskOverdue')}</p>
            <p className="text-2xl font-bold text-amber-600">{atRiskOverdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && !addOpen && !editOpen && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('milestones.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : milestones.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('milestones.noMilestones')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">{t('milestones.name')}</th>
                    <th className="text-left py-2 pr-4">{t('milestones.project')}</th>
                    <th className="text-left py-2 pr-4">{t('milestones.targetDate')}</th>
                    <th className="text-left py-2 pr-4">{t('milestones.actualDate')}</th>
                    <th className="text-left py-2 pr-4">{t('milestones.deliverable')}</th>
                    <th className="text-left py-2 pr-4">{t('milestones.status')}</th>
                    <th className="text-left py-2">{tc('labels.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => openEdit(m)}
                    >
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 pr-4 font-medium max-w-60 truncate">{m.description}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{m.project?.name || '-'}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{formatDate(m.targetDate)}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{m.actualDate ? formatDate(m.actualDate) : '-'}</td>
                      <td className="py-2 pr-4 max-w-50 truncate">{m.deliverable || '-'}</td>
                      <td className="py-2 pr-4"><StatusBadge status={m.status} /></td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openEdit(m) }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Milestone Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('milestones.addMilestone')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && addOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-description">{t('milestones.name')} *</Label>
              <Textarea
                id="add-description"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-project">{t('milestones.project')}</Label>
              <SearchableSelect
                id="add-project"
                options={projectOptions}
                value={addProjectId}
                onValueChange={setAddProjectId}
                placeholder={t('milestones.selectProject')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-target-date">{t('milestones.targetDate')} *</Label>
              <Input
                id="add-target-date"
                type="date"
                value={addTargetDate}
                onChange={(e) => setAddTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-deliverable">{t('milestones.deliverable')}</Label>
              <Input
                id="add-deliverable"
                value={addDeliverable}
                onChange={(e) => setAddDeliverable(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('milestones.editMilestone')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && editOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('milestones.name')} *</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target-date">{t('milestones.targetDate')} *</Label>
                <Input
                  id="edit-target-date"
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-actual-date">{t('milestones.actualDate')}</Label>
                <Input
                  id="edit-actual-date"
                  type="date"
                  value={editActualDate}
                  onChange={(e) => setEditActualDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deliverable">{t('milestones.deliverable')}</Label>
              <Input
                id="edit-deliverable"
                value={editDeliverable}
                onChange={(e) => setEditDeliverable(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('milestones.status')}</Label>
              <SearchableSelect
                id="edit-status"
                options={statusOptions}
                value={editStatus}
                onValueChange={setEditStatus}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('milestones.notes')}</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
