'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Pencil, Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const ACTIVITY_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'] as const

interface Project {
  id: string
  projectNo: string
  name: string
}

interface ActivityItem {
  id: string
  activityNo?: string
  name: string
  description: string | null
  status: string
  progress: number
  startDate: string | null
  endDate: string | null
  budget: number | string
  actualCost: number | string
  projectId: string
  responsibleId: string | null
  parentId: string | null
}

function toDateInput(val: string | null): string {
  if (!val) return ''
  return new Date(val).toISOString().split('T')[0]
}

export default function ActivityPlanningPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  // Project list + selection
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Activities
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [error, setError] = useState('')

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addStartDate, setAddStartDate] = useState('')
  const [addEndDate, setAddEndDate] = useState('')
  const [addBudget, setAddBudget] = useState('')

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editActivity, setEditActivity] = useState<ActivityItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editProgress, setEditProgress] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editActualCost, setEditActualCost] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      fetchActivities(selectedProjectId)
    } else {
      setActivities([])
    }
  }, [selectedProjectId])

  async function fetchProjects() {
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/v1/projects?limit=100')
      const json = await res.json()
      if (res.ok && json.success) {
        setProjects(json.data)
        if (json.data.length > 0) {
          setSelectedProjectId(json.data[0].id)
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingProjects(false)
    }
  }

  async function fetchActivities(projectId: string) {
    setLoadingActivities(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/activities?projectId=${projectId}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setActivities(json.data)
      } else {
        setError(json.error || tc('errors.loadFailed'))
        setActivities([])
      }
    } catch {
      setError(tc('errors.loadFailed'))
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  // --- Add Activity ---

  function openAddDialog() {
    setAddName('')
    setAddDescription('')
    setAddStartDate('')
    setAddEndDate('')
    setAddBudget('')
    setError('')
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!addName.trim()) {
      setError(t('activity.nameRequired'))
      return
    }
    setAddSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: addName.trim(),
      projectId: selectedProjectId,
    }
    if (addDescription.trim()) payload.description = addDescription.trim()
    if (addStartDate) payload.startDate = addStartDate
    if (addEndDate) payload.endDate = addEndDate
    if (addBudget) payload.budget = Number(addBudget)

    try {
      const res = await fetch('/api/v1/projects/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setAddOpen(false)
        fetchActivities(selectedProjectId)
      } else {
        setError(json.error || t('activity.failedToCreate'))
      }
    } catch {
      setError(t('activity.failedToCreate'))
    } finally {
      setAddSaving(false)
    }
  }

  // --- Edit Activity ---

  function openEditDialog(activity: ActivityItem) {
    setEditActivity(activity)
    setEditName(activity.name)
    setEditDescription(activity.description || '')
    setEditStatus(activity.status)
    setEditProgress(String(activity.progress))
    setEditStartDate(toDateInput(activity.startDate))
    setEditEndDate(toDateInput(activity.endDate))
    setEditBudget(String(Number(activity.budget) || ''))
    setEditActualCost(String(Number(activity.actualCost) || ''))
    setError('')
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editActivity) return
    if (!editName.trim()) {
      setError(t('activity.nameRequired'))
      return
    }
    setEditSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: editName.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
      progress: Number(editProgress) || 0,
      startDate: editStartDate || null,
      endDate: editEndDate || null,
      budget: Number(editBudget) || 0,
      actualCost: Number(editActualCost) || 0,
    }

    try {
      const res = await fetch(`/api/v1/projects/activities/${editActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditOpen(false)
        setEditActivity(null)
        fetchActivities(selectedProjectId)
      } else {
        setError(json.error || t('activity.failedToUpdate'))
      }
    } catch {
      setError(t('activity.failedToUpdate'))
    } finally {
      setEditSaving(false)
    }
  }

  // --- Summary stats ---

  const totalActivities = activities.length
  const inProgressCount = activities.filter((a) => a.status === 'IN_PROGRESS').length
  const completedCount = activities.filter((a) => a.status === 'COMPLETED').length
  const delayedCount = activities.filter((a) => a.status === 'DELAYED').length

  const summaryStats = [
    {
      label: t('activity.totalActivities'),
      value: totalActivities,
      icon: Activity,
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: t('activity.inProgress'),
      value: inProgressCount,
      icon: Clock,
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: t('activity.completed'),
      value: completedCount,
      icon: CheckCircle2,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('activity.delayed'),
      value: delayedCount,
      icon: AlertTriangle,
      accent: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('activity.planningTitle')} description={t('activity.planningDescription')}>
        {selectedProjectId && (
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {t('activity.addActivity')}
          </Button>
        )}
      </PageHeader>

      {/* Project Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md space-y-2">
            <Label>{t('activity.selectProject')}</Label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc('labels.loading')}
              </div>
            ) : (
              <SearchableSelect
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  description: p.projectNo,
                }))}
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                placeholder={t('activity.selectProjectPlaceholder')}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {selectedProjectId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {summaryStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.accent}`} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold font-mono">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !addOpen && !editOpen && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Activities Table */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('activity.activitiesList')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {t('activity.noActivities')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">{t('activity.activityId')}</th>
                      <th className="text-left py-2 pr-4">{t('fields.name')}</th>
                      <th className="text-left py-2 pr-4">{tc('labels.status')}</th>
                      <th className="text-left py-2 pr-4">{t('fields.startDate')}</th>
                      <th className="text-left py-2 pr-4">{t('fields.endDate')}</th>
                      <th className="text-right py-2 pr-4">{t('activity.budget')}</th>
                      <th className="text-left py-2 pr-4">{t('fields.progress')}</th>
                      <th className="text-left py-2">{tc('labels.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => openEditDialog(activity)}
                      >
                        <td className="py-2 pr-4 font-mono text-xs">
                          {activity.activityNo || activity.id.slice(0, 8)}
                        </td>
                        <td className="py-2 pr-4 font-medium">{activity.name}</td>
                        <td className="py-2 pr-4">
                          <StatusBadge status={activity.status} />
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {activity.startDate ? formatDate(activity.startDate) : '-'}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {activity.endDate ? formatDate(activity.endDate) : '-'}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono whitespace-nowrap">
                          {formatCurrency(Number(activity.budget) || 0)}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2 min-w-25">
                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${Math.min(activity.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{activity.progress}%</span>
                          </div>
                        </td>
                        <td className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(activity)
                            }}
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
      )}

      {/* Add Activity Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('activity.addActivity')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && addOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-name">{t('fields.name')} *</Label>
              <Input
                id="add-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t('activity.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-project">{t('activity.project')}</Label>
              <Input
                id="add-project"
                value={projects.find((p) => p.id === selectedProjectId)?.name || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">{t('fields.description')}</Label>
              <Textarea
                id="add-description"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-start-date">{t('fields.startDate')}</Label>
                <Input
                  id="add-start-date"
                  type="date"
                  value={addStartDate}
                  onChange={(e) => setAddStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-end-date">{t('fields.endDate')}</Label>
                <Input
                  id="add-end-date"
                  type="date"
                  value={addEndDate}
                  onChange={(e) => setAddEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-budget">{t('activity.budget')}</Label>
              <Input
                id="add-budget"
                type="number"
                min="0"
                step="0.01"
                value={addBudget}
                onChange={(e) => setAddBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addSaving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={addSaving}>
              {addSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc('buttons.saving')}
                </>
              ) : (
                t('activity.addActivity')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('activity.editActivity')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && editOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('fields.name')} *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('fields.description')}</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tc('labels.status')}</Label>
                <SearchableSelect
                  options={ACTIVITY_STATUSES.map((s) => ({
                    value: s,
                    label: tc(`status.${s}`),
                  }))}
                  value={editStatus}
                  onValueChange={setEditStatus}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-progress">{t('fields.progress')} (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">{t('fields.startDate')}</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">{t('fields.endDate')}</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget">{t('activity.budget')}</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-actual-cost">{t('activity.actualCost')}</Label>
                <Input
                  id="edit-actual-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editActualCost}
                  onChange={(e) => setEditActualCost(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tc('buttons.saving')}
                </>
              ) : (
                tc('buttons.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
