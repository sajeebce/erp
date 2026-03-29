'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

type RiskCategory =
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'STRATEGIC'
  | 'COMPLIANCE'
  | 'SECURITY'
  | 'REPUTATIONAL'
  | 'ENVIRONMENTAL'
  | 'POLITICAL'

type Likelihood = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
type Impact = 'NEGLIGIBLE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE'
type RiskStatus = 'OPEN' | 'MITIGATED' | 'CLOSED' | 'MATERIALIZED'

interface Risk {
  id: string
  title: string
  projectId: string
  description: string | null
  category: RiskCategory
  likelihood: Likelihood
  impact: Impact
  riskScore: number
  mitigation: string | null
  owner: string | null
  status: RiskStatus
  reviewDate: string | null
}

const CATEGORIES: RiskCategory[] = [
  'FINANCIAL',
  'OPERATIONAL',
  'STRATEGIC',
  'COMPLIANCE',
  'SECURITY',
  'REPUTATIONAL',
  'ENVIRONMENTAL',
  'POLITICAL',
]

const LIKELIHOODS: Likelihood[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']
const IMPACTS: Impact[] = ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE']
const STATUSES: RiskStatus[] = ['OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED']

const LIKELIHOOD_VALUES: Record<Likelihood, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
}

const IMPACT_VALUES: Record<Impact, number> = {
  NEGLIGIBLE: 1,
  MINOR: 2,
  MODERATE: 3,
  MAJOR: 4,
  SEVERE: 5,
}

const EMPTY_FORM = {
  title: '',
  category: 'OPERATIONAL' as RiskCategory,
  likelihood: 'MEDIUM' as Likelihood,
  impact: 'MODERATE' as Impact,
  mitigation: '',
  owner: '',
  status: 'OPEN' as RiskStatus,
  reviewDate: '',
  description: '',
}

function scoreColor(score: number): string {
  if (score <= 4) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (score <= 9) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (score <= 16) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

// ---------- component ----------

export default function RiskRegisterPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [projects, setProjects] = useState<Project[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')

  // dialogs
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Risk | null>(null)
  const [deleteItem, setDeleteItem] = useState<Risk | null>(null)
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

  const fetchRisks = useCallback(async (projectId?: string) => {
    try {
      const url = projectId
        ? `/api/v1/projects/risks?projectId=${projectId}`
        : '/api/v1/projects/risks'
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.risks ?? json ?? []
        setRisks(Array.isArray(list) ? list : [])
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
    fetchRisks(projectFilter || undefined)
  }, [projectFilter, fetchRisks])

  // ---------- form helpers ----------

  function resetForm() {
    setForm({ ...EMPTY_FORM })
  }

  function openAdd() {
    resetForm()
    setShowAdd(true)
  }

  function openEdit(risk: Risk) {
    setForm({
      title: risk.title,
      category: risk.category,
      likelihood: risk.likelihood,
      impact: risk.impact,
      mitigation: risk.mitigation ?? '',
      owner: risk.owner ?? '',
      status: risk.status,
      reviewDate: risk.reviewDate ? new Date(risk.reviewDate).toISOString().split('T')[0] : '',
      description: risk.description ?? '',
    })
    setEditItem(risk)
  }

  // ---------- actions ----------

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        category: form.category,
        likelihood: form.likelihood,
        impact: form.impact,
        mitigation: form.mitigation || null,
        owner: form.owner || null,
        status: form.status,
        reviewDate: form.reviewDate || null,
        description: form.description || null,
      }

      if (editItem) {
        const res = await fetch(`/api/v1/projects/risks/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          await fetchRisks(projectFilter || undefined)
          setEditItem(null)
        }
      } else {
        body.projectId = projectFilter || projects[0]?.id
        const res = await fetch('/api/v1/projects/risks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          await fetchRisks(projectFilter || undefined)
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
      const res = await fetch(`/api/v1/projects/risks/${deleteItem.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchRisks(projectFilter || undefined)
        setDeleteItem(null)
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  // ---------- computed ----------

  const totalRisks = risks.length
  const openRisks = risks.filter(r => r.status === 'OPEN').length
  const mitigatedRisks = risks.filter(r => r.status === 'MITIGATED').length
  const highCritical = risks.filter(r => r.riskScore >= 12).length

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
        <Label>{t('risks.riskTitle')} *</Label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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
          <Label>{t('risks.category')}</Label>
          <SearchableSelect
            options={CATEGORIES.map(v => ({
              value: v,
              label: t(`risks.categories.${v}`),
            }))}
            value={form.category}
            onValueChange={v => setForm(f => ({ ...f, category: v as RiskCategory }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('risks.status')}</Label>
          <SearchableSelect
            options={STATUSES.map(v => ({
              value: v,
              label: t(`risks.statuses.${v}`),
            }))}
            value={form.status}
            onValueChange={v => setForm(f => ({ ...f, status: v as RiskStatus }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('risks.likelihood')}</Label>
          <SearchableSelect
            options={LIKELIHOODS.map(v => ({
              value: v,
              label: t(`risks.likelihoods.${v}`),
            }))}
            value={form.likelihood}
            onValueChange={v => setForm(f => ({ ...f, likelihood: v as Likelihood }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('risks.impact')}</Label>
          <SearchableSelect
            options={IMPACTS.map(v => ({
              value: v,
              label: t(`risks.impacts.${v}`),
            }))}
            value={form.impact}
            onValueChange={v => setForm(f => ({ ...f, impact: v as Impact }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('risks.owner')}</Label>
          <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>{t('risks.reviewDate')}</Label>
          <Input
            type="date"
            value={form.reviewDate}
            onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('risks.mitigation')}</Label>
        <Textarea
          value={form.mitigation}
          onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))}
          rows={3}
        />
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
      <PageHeader title={t('risks.title')}>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('risks.addRisk')}
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

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('risks.totalRisks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('risks.statuses.OPEN')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{openRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('risks.statuses.MITIGATED')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{mitigatedRisks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('risks.highCritical')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{highCritical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Risks table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('risks.riskTitle')}</TableHead>
                  <TableHead>{t('risks.category')}</TableHead>
                  <TableHead>{t('risks.likelihood')}</TableHead>
                  <TableHead>{t('risks.impact')}</TableHead>
                  <TableHead className="text-center">{t('risks.score')}</TableHead>
                  <TableHead>{t('risks.mitigation')}</TableHead>
                  <TableHead>{t('risks.owner')}</TableHead>
                  <TableHead>{t('risks.status')}</TableHead>
                  <TableHead className="text-right">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {tc('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  risks.map(risk => (
                    <TableRow
                      key={risk.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => openEdit(risk)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {risk.title}
                      </TableCell>
                      <TableCell>{t(`risks.categories.${risk.category}`)}</TableCell>
                      <TableCell>{t(`risks.likelihoods.${risk.likelihood}`)}</TableCell>
                      <TableCell>{t(`risks.impacts.${risk.impact}`)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={scoreColor(risk.riskScore)} variant="secondary">
                          {risk.riskScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {risk.mitigation ?? '-'}
                      </TableCell>
                      <TableCell>{risk.owner ?? '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={risk.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation()
                              openEdit(risk)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation()
                              setDeleteItem(risk)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
            <DialogTitle>{t('risks.addRisk')}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.title || saving}>
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
            <DialogTitle>{tc('buttons.edit')} {t('risks.title')}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.title || saving}>
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
            {tc('deleteConfirmation', { name: deleteItem?.title ?? '' })}
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
