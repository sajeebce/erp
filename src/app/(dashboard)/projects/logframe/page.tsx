'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { cn } from '@/lib/utils'

const LOGFRAME_LEVELS = ['GOAL', 'PURPOSE', 'OUTPUT', 'ACTIVITY'] as const

const levelStyles: Record<string, string> = {
  GOAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PURPOSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OUTPUT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ACTIVITY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

interface Project {
  id: string
  name: string
  projectNo: string
}

interface LogframeEntry {
  id: string
  projectId: string
  project?: { id: string; name: string; projectNo: string }
  level: string
  narrative: string
  indicators: string | null
  meansOfVerification: string | null
  assumptions: string | null
  parentId: string | null
  sortOrder: number
}

export default function LogframePage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')

  // Data
  const [projects, setProjects] = useState<Project[]>([])
  const [entries, setEntries] = useState<LogframeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter
  const [filterProjectId, setFilterProjectId] = useState('')

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addProjectId, setAddProjectId] = useState('')
  const [addLevel, setAddLevel] = useState('')
  const [addNarrative, setAddNarrative] = useState('')
  const [addIndicators, setAddIndicators] = useState('')
  const [addMov, setAddMov] = useState('')
  const [addAssumptions, setAddAssumptions] = useState('')
  const [addParentId, setAddParentId] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editNarrative, setEditNarrative] = useState('')
  const [editIndicators, setEditIndicators] = useState('')
  const [editMov, setEditMov] = useState('')
  const [editAssumptions, setEditAssumptions] = useState('')
  const [editParentId, setEditParentId] = useState('')
  const [editSortOrder, setEditSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchEntries()
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

  async function fetchEntries() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterProjectId) params.set('projectId', filterProjectId)
      const res = await fetch(`/api/v1/projects/logframe?${params}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setEntries(json.data || [])
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
    setAddProjectId(filterProjectId)
    setAddLevel('')
    setAddNarrative('')
    setAddIndicators('')
    setAddMov('')
    setAddAssumptions('')
    setAddParentId('')
    setError('')
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!addLevel || !addNarrative.trim()) {
      setError(tc('errors.requiredFields'))
      return
    }

    setAdding(true)
    setError('')
    try {
      const maxSort = entries
        .filter((e) => e.level === addLevel)
        .reduce((max, e) => Math.max(max, e.sortOrder), 0)
      const res = await fetch('/api/v1/projects/logframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: addProjectId || undefined,
          level: addLevel,
          narrative: addNarrative.trim(),
          indicators: addIndicators.trim() || null,
          meansOfVerification: addMov.trim() || null,
          assumptions: addAssumptions.trim() || null,
          parentId: addParentId || null,
          sortOrder: maxSort + 1,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setAddOpen(false)
        fetchEntries()
      } else {
        setError(json.error || tc('errors.saveFailed'))
      }
    } catch {
      setError(tc('errors.saveFailed'))
    } finally {
      setAdding(false)
    }
  }

  function openEdit(entry: LogframeEntry) {
    setEditId(entry.id)
    setEditLevel(entry.level)
    setEditNarrative(entry.narrative)
    setEditIndicators(entry.indicators || '')
    setEditMov(entry.meansOfVerification || '')
    setEditAssumptions(entry.assumptions || '')
    setEditParentId(entry.parentId || '')
    setEditSortOrder(String(entry.sortOrder))
    setError('')
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editLevel || !editNarrative.trim()) {
      setError(tc('errors.requiredFields'))
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/logframe/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: editLevel,
          narrative: editNarrative.trim(),
          indicators: editIndicators.trim() || null,
          meansOfVerification: editMov.trim() || null,
          assumptions: editAssumptions.trim() || null,
          parentId: editParentId || null,
          sortOrder: Number(editSortOrder) || 0,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditOpen(false)
        fetchEntries()
      } else {
        setError(json.error || tc('errors.saveFailed'))
      }
    } catch {
      setError(tc('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  // Summary counts by level
  const goalCount = entries.filter((e) => e.level === 'GOAL').length
  const purposeCount = entries.filter((e) => e.level === 'PURPOSE').length
  const outputCount = entries.filter((e) => e.level === 'OUTPUT').length
  const activityCount = entries.filter((e) => e.level === 'ACTIVITY').length

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: `${p.projectNo} — ${p.name}`,
  }))

  const levelLabelMap: Record<string, string> = {
    GOAL: t('logFrame.goal'),
    PURPOSE: t('logFrame.purpose'),
    OUTPUT: t('logFrame.output'),
    ACTIVITY: t('logFrame.activity'),
  }

  const levelOptions = LOGFRAME_LEVELS.map((l) => ({
    value: l,
    label: levelLabelMap[l],
  }))

  const parentOptions = entries
    .filter((e) => e.id !== editId)
    .map((e) => ({
      value: e.id,
      label: `[${levelLabelMap[e.level] || e.level}] ${e.narrative.substring(0, 60)}${e.narrative.length > 60 ? '...' : ''}`,
    }))

  function LevelBadge({ level }: { level: string }) {
    const style = levelStyles[level] || 'bg-gray-100 text-gray-700'
    return (
      <Badge variant="secondary" className={cn('font-medium text-[11px] px-2 py-0.5', style)}>
        {levelLabelMap[level] || level}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('logFrame.title')} description={t('logFrame.description')}>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('logFrame.addEntry')}
        </Button>
      </PageHeader>

      {/* Project filter */}
      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
          <SearchableSelect
            options={[{ value: '', label: tc('filters.all') }, ...projectOptions]}
            value={filterProjectId}
            onValueChange={setFilterProjectId}
            placeholder={t('logFrame.selectProject')}
          />
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('logFrame.goal')}s</p>
            <p className="text-2xl font-bold text-red-600">{goalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('logFrame.purpose')}s</p>
            <p className="text-2xl font-bold text-blue-600">{purposeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('logFrame.outputs')}</p>
            <p className="text-2xl font-bold text-emerald-600">{outputCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('logFrame.activities')}</p>
            <p className="text-2xl font-bold text-amber-600">{activityCount}</p>
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
          <CardTitle>{t('logFrame.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('logFrame.noEntries')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">{t('logFrame.level')}</th>
                    <th className="text-left py-2 pr-4">{t('logFrame.narrativeSummary')}</th>
                    <th className="text-left py-2 pr-4">{t('logFrame.ovi')}</th>
                    <th className="text-left py-2 pr-4">{t('logFrame.mov')}</th>
                    <th className="text-left py-2 pr-4">{t('logFrame.assumptions')}</th>
                    <th className="text-left py-2">{tc('labels.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer align-top"
                      onClick={() => openEdit(entry)}
                    >
                      <td className="py-2 pr-4">
                        <LevelBadge level={entry.level} />
                      </td>
                      <td className="py-2 pr-4 max-w-60">
                        <p className="font-medium line-clamp-2">{entry.narrative}</p>
                      </td>
                      <td className="py-2 pr-4 max-w-50 text-muted-foreground">
                        <p className="line-clamp-2">{entry.indicators || '-'}</p>
                      </td>
                      <td className="py-2 pr-4 max-w-50 text-muted-foreground">
                        <p className="line-clamp-2">{entry.meansOfVerification || '-'}</p>
                      </td>
                      <td className="py-2 pr-4 max-w-50 text-muted-foreground">
                        <p className="line-clamp-2">{entry.assumptions || '-'}</p>
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openEdit(entry) }}
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

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('logFrame.addEntry')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && addOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-project">{t('milestones.project')}</Label>
              <SearchableSelect
                id="add-project"
                options={projectOptions}
                value={addProjectId}
                onValueChange={setAddProjectId}
                placeholder={t('logFrame.selectProject')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-level">{t('logFrame.level')} *</Label>
              <SearchableSelect
                id="add-level"
                options={levelOptions}
                value={addLevel}
                onValueChange={setAddLevel}
                placeholder={t('logFrame.selectLevel')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-narrative">{t('logFrame.narrativeSummary')} *</Label>
              <Textarea
                id="add-narrative"
                value={addNarrative}
                onChange={(e) => setAddNarrative(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-indicators">{t('logFrame.ovi')}</Label>
              <Textarea
                id="add-indicators"
                value={addIndicators}
                onChange={(e) => setAddIndicators(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-mov">{t('logFrame.mov')}</Label>
              <Textarea
                id="add-mov"
                value={addMov}
                onChange={(e) => setAddMov(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-assumptions">{t('logFrame.assumptions')}</Label>
              <Textarea
                id="add-assumptions"
                value={addAssumptions}
                onChange={(e) => setAddAssumptions(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-parent">{t('logFrame.selectParent')}</Label>
              <SearchableSelect
                id="add-parent"
                options={[{ value: '', label: '-' }, ...parentOptions]}
                value={addParentId}
                onValueChange={setAddParentId}
                placeholder={t('logFrame.selectParent')}
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

      {/* Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('logFrame.editEntry')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && editOpen && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-level">{t('logFrame.level')} *</Label>
              <SearchableSelect
                id="edit-level"
                options={levelOptions}
                value={editLevel}
                onValueChange={setEditLevel}
                placeholder={t('logFrame.selectLevel')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-narrative">{t('logFrame.narrativeSummary')} *</Label>
              <Textarea
                id="edit-narrative"
                value={editNarrative}
                onChange={(e) => setEditNarrative(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-indicators">{t('logFrame.ovi')}</Label>
              <Textarea
                id="edit-indicators"
                value={editIndicators}
                onChange={(e) => setEditIndicators(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mov">{t('logFrame.mov')}</Label>
              <Textarea
                id="edit-mov"
                value={editMov}
                onChange={(e) => setEditMov(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assumptions">{t('logFrame.assumptions')}</Label>
              <Textarea
                id="edit-assumptions"
                value={editAssumptions}
                onChange={(e) => setEditAssumptions(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parent">{t('logFrame.selectParent')}</Label>
              <SearchableSelect
                id="edit-parent"
                options={[{ value: '', label: '-' }, ...parentOptions]}
                value={editParentId}
                onValueChange={setEditParentId}
                placeholder={t('logFrame.selectParent')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sort-order">Sort Order</Label>
              <Input
                id="edit-sort-order"
                type="number"
                min="0"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(e.target.value)}
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
