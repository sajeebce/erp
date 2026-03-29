'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ---------- types ----------

interface Project {
  id: string
  name: string
  projectNo: string
}

type IndicatorType = 'QUANTITATIVE' | 'QUALITATIVE'
type Frequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'END_OF_PROJECT'

interface Indicator {
  id: string
  name: string
  projectId: string
  description: string | null
  type: IndicatorType
  unit: string | null
  baselineValue: number | string | null
  baselineDate: string | null
  targetValue: number | string | null
  currentValue: number | string | null
  frequency: Frequency | null
  dataSource: string | null
  responsible: string | null
  disaggregation: string | null
}

const INDICATOR_TYPES: IndicatorType[] = ['QUANTITATIVE', 'QUALITATIVE']
const FREQUENCIES: Frequency[] = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'END_OF_PROJECT']

const FREQUENCY_LABELS: Record<Frequency, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUALLY: 'Semi-Annually',
  ANNUALLY: 'Annually',
  END_OF_PROJECT: 'End of Project',
}

const EMPTY_FORM = {
  name: '',
  type: 'QUANTITATIVE' as IndicatorType,
  unit: '',
  baselineValue: '',
  baselineDate: '',
  targetValue: '',
  currentValue: '',
  frequency: 'QUARTERLY' as Frequency,
  dataSource: '',
  responsible: '',
  disaggregation: '',
  description: '',
}

// ---------- component ----------

export default function IndicatorsPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [projects, setProjects] = useState<Project[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')

  // dialogs
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Indicator | null>(null)
  const [deleteItem, setDeleteItem] = useState<Indicator | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ---------- data fetching ----------

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/projects?limit=100')
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.projects ?? json ?? []
        setProjects(Array.isArray(list) ? list : [])
      }
    } catch {
      /* silent */
    }
  }, [])

  const fetchIndicators = useCallback(async (projectId?: string) => {
    try {
      const url = projectId
        ? `/api/v1/projects/indicators?projectId=${projectId}`
        : '/api/v1/projects/indicators'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.indicators ?? json ?? []
        setIndicators(Array.isArray(list) ? list : [])
      }
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await fetchProjects()
      setLoading(false)
    }
    load()
  }, [fetchProjects])

  useEffect(() => {
    fetchIndicators(projectFilter || undefined)
  }, [projectFilter, fetchIndicators])

  // ---------- form helpers ----------

  function resetForm() {
    setForm({ ...EMPTY_FORM })
  }

  function openAdd() {
    resetForm()
    if (projectFilter) {
      // pre-select current filter project
    }
    setShowAdd(true)
  }

  function openEdit(ind: Indicator) {
    setForm({
      name: ind.name,
      type: ind.type,
      unit: ind.unit ?? '',
      baselineValue: String(ind.baselineValue ?? ''),
      baselineDate: ind.baselineDate ? new Date(ind.baselineDate).toISOString().split('T')[0] : '',
      targetValue: String(ind.targetValue ?? ''),
      currentValue: String(ind.currentValue ?? ''),
      frequency: ind.frequency ?? 'QUARTERLY',
      dataSource: ind.dataSource ?? '',
      responsible: ind.responsible ?? '',
      disaggregation: ind.disaggregation ?? '',
      description: ind.description ?? '',
    })
    setEditItem(ind)
  }

  // ---------- actions ----------

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        unit: form.unit || null,
        baselineValue: form.baselineValue ? Number(form.baselineValue) : null,
        baselineDate: form.baselineDate || null,
        targetValue: form.targetValue ? Number(form.targetValue) : null,
        currentValue: form.currentValue ? Number(form.currentValue) : null,
        frequency: form.frequency,
        dataSource: form.dataSource || null,
        responsible: form.responsible || null,
        disaggregation: form.disaggregation || null,
        description: form.description || null,
      }

      if (editItem) {
        const res = await fetch(`/api/v1/projects/indicators/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          await fetchIndicators(projectFilter || undefined)
          setEditItem(null)
        }
      } else {
        body.projectId = projectFilter || projects[0]?.id
        const res = await fetch('/api/v1/projects/indicators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          await fetchIndicators(projectFilter || undefined)
          setShowAdd(false)
          resetForm()
        }
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteItem) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/projects/indicators/${deleteItem.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchIndicators(projectFilter || undefined)
        setDeleteItem(null)
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  // ---------- computed ----------

  function achievement(ind: Indicator): number {
    const target = Number(ind.targetValue)
    const current = Number(ind.currentValue)
    if (!target || target <= 0) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  // ---------- render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const formFields = (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>{t('indicators.name')} *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      {!editItem && (
        <div className="space-y-2">
          <Label>{tc('project')}</Label>
          <SearchableSelect
            options={projects.map(p => ({
              value: p.id,
              label: `${p.projectNo ? p.projectNo + ' - ' : ''}${p.name}`,
            }))}
            value={projectFilter}
            onValueChange={v => setProjectFilter(v)}
            placeholder={tc('selectProject')}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('indicators.type')}</Label>
          <SearchableSelect
            options={INDICATOR_TYPES.map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }))}
            value={form.type}
            onValueChange={v => setForm(f => ({ ...f, type: v as IndicatorType }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('indicators.unit')}</Label>
          <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('indicators.baseline')}</Label>
          <Input
            type="number"
            value={form.baselineValue}
            onChange={e => setForm(f => ({ ...f, baselineValue: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('indicators.baselineDate')}</Label>
          <Input
            type="date"
            value={form.baselineDate}
            onChange={e => setForm(f => ({ ...f, baselineDate: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('indicators.target')}</Label>
          <Input
            type="number"
            value={form.targetValue}
            onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('indicators.current')}</Label>
          <Input
            type="number"
            value={form.currentValue}
            onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('indicators.frequency')}</Label>
          <SearchableSelect
            options={FREQUENCIES.map(v => ({ value: v, label: FREQUENCY_LABELS[v] }))}
            value={form.frequency}
            onValueChange={v => setForm(f => ({ ...f, frequency: v as Frequency }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('indicators.dataSource')}</Label>
          <Input value={form.dataSource} onChange={e => setForm(f => ({ ...f, dataSource: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('indicators.responsible')}</Label>
          <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>{t('indicators.disaggregation')}</Label>
          <Input
            value={form.disaggregation}
            onChange={e => setForm(f => ({ ...f, disaggregation: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{tc('description')}</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('indicators.title')}>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('indicators.addIndicator')}
        </Button>
      </PageHeader>

      {/* Project filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm">
            <Label>{tc('filterByProject')}</Label>
            <SearchableSelect
              options={[
                { value: '', label: tc('all') },
                ...projects.map(p => ({
                  value: p.id,
                  label: `${p.projectNo ? p.projectNo + ' - ' : ''}${p.name}`,
                })),
              ]}
              value={projectFilter}
              onValueChange={setProjectFilter}
              placeholder={tc('selectProject')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Indicators table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('indicators.name')}</TableHead>
                  <TableHead>{t('indicators.type')}</TableHead>
                  <TableHead>{t('indicators.unit')}</TableHead>
                  <TableHead className="text-right">{t('indicators.baseline')}</TableHead>
                  <TableHead className="text-right">{t('indicators.target')}</TableHead>
                  <TableHead className="text-right">{t('indicators.current')}</TableHead>
                  <TableHead className="w-[180px]">{t('indicators.achievement')}</TableHead>
                  <TableHead>{t('indicators.frequency')}</TableHead>
                  <TableHead className="text-right">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {tc('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  indicators.map(ind => {
                    const pct = achievement(ind)
                    return (
                      <TableRow
                        key={ind.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => openEdit(ind)}
                      >
                        <TableCell className="font-medium">{ind.name}</TableCell>
                        <TableCell>{ind.type}</TableCell>
                        <TableCell>{ind.unit ?? '-'}</TableCell>
                        <TableCell className="text-right">{ind.baselineValue ?? '-'}</TableCell>
                        <TableCell className="text-right">{ind.targetValue ?? '-'}</TableCell>
                        <TableCell className="text-right">{ind.currentValue ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ind.frequency ? FREQUENCY_LABELS[ind.frequency] ?? ind.frequency : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation()
                                openEdit(ind)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation()
                                setDeleteItem(ind)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('indicators.addIndicator')}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.name || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tc('buttons.edit')} {t('indicators.title')}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.name || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc('confirmDelete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            {tc('deleteConfirmation', { name: deleteItem?.name ?? '' })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              {tc('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tc('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
