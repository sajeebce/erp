'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus, Loader2, BarChart3, FolderTree, Percent, Trash2,
  Play, History, ChevronDown, ChevronRight, Power, PowerOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchableSelect, type SelectOption } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ─── Types ───

interface AllocationRule {
  id: string
  name: string
  description: string | null
  totalAmount: number | string
  isActive: boolean
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  createdAt: string
  updatedAt: string
  _count: { entries: number }
}

interface AllocationEntry {
  projectId: string
  percentage: number
  allocatedAmount: number
}

interface Project {
  id: string
  name: string
}

interface ApplyResult {
  ruleId: string
  ruleName: string
  totalAmount: number
  periodStart: string
  periodEnd: string
  entries: Array<{
    id: string
    projectId: string
    percentage: string
    allocatedAmount: string
    periodStart: string
    periodEnd: string
    project: { id: string; name: string }
  }>
}

interface HistoryEntry {
  id: string
  ruleId: string
  projectId: string
  percentage: string
  allocatedAmount: string
  periodStart: string
  periodEnd: string
  createdAt: string
  project: { id: string; name: string }
  rule: { id: string; name: string }
}

// ─── Component ───

export default function CostAllocationPage() {
  const t = useTranslations('budget.costAllocation')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  // ─── State ───
  const [rules, setRules] = useState<AllocationRule[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Rule form dialog
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTotalAmount, setFormTotalAmount] = useState('')
  const [formFrequency, setFormFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>('MONTHLY')
  const [formEntries, setFormEntries] = useState<AllocationEntry[]>([])
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [applyRule, setApplyRule] = useState<AllocationRule | null>(null)
  const [applyPeriodStart, setApplyPeriodStart] = useState('')
  const [applyPeriodEnd, setApplyPeriodEnd] = useState('')
  const [applyEntries, setApplyEntries] = useState<AllocationEntry[]>([])
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)

  // Expanded rule in list
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)

  // Active tab
  const [activeTab, setActiveTab] = useState('rules')

  // ─── Data Loading ───

  const loadRules = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/v1/budget/cost-allocation?limit=100')
      if (!res.ok) throw new Error(t('failedToLoad'))
      const json = await res.json()
      setRules(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/projects?limit=200')
      if (!res.ok) return
      const json = await res.json()
      setProjects(json.data ?? [])
    } catch {
      // silently fail – projects are optional until needed
    }
  }, [])

  useEffect(() => {
    loadRules()
    loadProjects()
  }, [loadRules, loadProjects])

  // ─── Summary Stats ───

  const totalSharedCosts = rules.reduce(
    (sum, r) => sum + Number(r.totalAmount), 0
  )
  const activeRules = rules.filter(r => r.isActive).length
  const totalEntries = rules.reduce((sum, r) => sum + (r._count?.entries ?? 0), 0)

  // ─── Project options for SearchableSelect ───

  const projectOptions: SelectOption[] = projects.map(p => ({
    value: p.id,
    label: p.name,
  }))

  // ─── Frequency options ───

  const frequencyOptions: SelectOption[] = [
    { value: 'MONTHLY', label: t('monthly') },
    { value: 'QUARTERLY', label: t('quarterly') },
    { value: 'ANNUALLY', label: t('annually') },
  ]

  // ─── Rule Form Helpers ───

  function openCreateDialog() {
    setEditingRule(null)
    setFormName('')
    setFormDescription('')
    setFormTotalAmount('')
    setFormFrequency('MONTHLY')
    setFormEntries([{ projectId: '', percentage: 0, allocatedAmount: 0 }])
    setFormError('')
    setRuleDialogOpen(true)
  }

  function openEditDialog(rule: AllocationRule) {
    setEditingRule(rule)
    setFormName(rule.name)
    setFormDescription(rule.description ?? '')
    setFormTotalAmount(String(Number(rule.totalAmount)))
    setFormFrequency(rule.frequency)
    setFormEntries([{ projectId: '', percentage: 0, allocatedAmount: 0 }])
    setFormError('')
    setRuleDialogOpen(true)
  }

  function addEntryRow() {
    setFormEntries(prev => [...prev, { projectId: '', percentage: 0, allocatedAmount: 0 }])
  }

  function removeEntryRow(index: number) {
    setFormEntries(prev => prev.filter((_, i) => i !== index))
  }

  function updateEntry(index: number, field: 'projectId' | 'percentage', value: string | number) {
    setFormEntries(prev => {
      const updated = [...prev]
      const entry = { ...updated[index] }
      if (field === 'projectId') {
        entry.projectId = value as string
      } else {
        const pct = Number(value) || 0
        entry.percentage = pct
        entry.allocatedAmount = (Number(formTotalAmount) || 0) * pct / 100
      }
      updated[index] = entry
      return updated
    })
  }

  function recalcAllocatedAmounts(totalAmount: number) {
    setFormEntries(prev =>
      prev.map(e => ({
        ...e,
        allocatedAmount: totalAmount * e.percentage / 100,
      }))
    )
  }

  const formTotalPercentage = formEntries.reduce((s, e) => s + e.percentage, 0)
  const formPercentageValid = Math.abs(formTotalPercentage - 100) < 0.01

  async function handleSaveRule() {
    setFormError('')

    if (!formName.trim()) {
      setFormError(t('nameRequired'))
      return
    }
    if (!formTotalAmount || Number(formTotalAmount) <= 0) {
      setFormError(t('amountRequired'))
      return
    }

    try {
      setFormSaving(true)

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        totalAmount: Number(formTotalAmount),
        frequency: formFrequency,
      }

      const url = editingRule
        ? `/api/v1/budget/cost-allocation/${editingRule.id}`
        : '/api/v1/budget/cost-allocation'
      const method = editingRule ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? t('failedToSave'))
      }

      setRuleDialogOpen(false)
      await loadRules()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('failedToSave'))
    } finally {
      setFormSaving(false)
    }
  }

  // ─── Toggle Active ───

  async function toggleActive(rule: AllocationRule) {
    try {
      const res = await fetch(`/api/v1/budget/cost-allocation/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      if (res.ok) await loadRules()
    } catch {
      // silently fail
    }
  }

  // ─── Apply Allocation ───

  function openApplyDialog(rule: AllocationRule) {
    setApplyRule(rule)
    setApplyPeriodStart('')
    setApplyPeriodEnd('')
    setApplyEntries([{ projectId: '', percentage: 0, allocatedAmount: 0 }])
    setApplyError('')
    setApplyResult(null)
    setApplyDialogOpen(true)
  }

  function addApplyEntry() {
    setApplyEntries(prev => [...prev, { projectId: '', percentage: 0, allocatedAmount: 0 }])
  }

  function removeApplyEntry(index: number) {
    setApplyEntries(prev => prev.filter((_, i) => i !== index))
  }

  function updateApplyEntry(index: number, field: 'projectId' | 'percentage', value: string | number) {
    setApplyEntries(prev => {
      const updated = [...prev]
      const entry = { ...updated[index] }
      if (field === 'projectId') {
        entry.projectId = value as string
      } else {
        const pct = Number(value) || 0
        entry.percentage = pct
        entry.allocatedAmount = Number(applyRule?.totalAmount ?? 0) * pct / 100
      }
      updated[index] = entry
      return updated
    })
  }

  const applyTotalPercentage = applyEntries.reduce((s, e) => s + e.percentage, 0)
  const applyPercentageValid = Math.abs(applyTotalPercentage - 100) < 0.01

  async function handleApply() {
    setApplyError('')

    if (!applyPeriodStart || !applyPeriodEnd) {
      setApplyError(t('periodRequired'))
      return
    }
    if (applyEntries.length === 0 || applyEntries.some(e => !e.projectId)) {
      setApplyError(t('selectProjectsRequired'))
      return
    }
    if (!applyPercentageValid) {
      setApplyError(t('percentageMustEqual100'))
      return
    }

    try {
      setApplying(true)
      const res = await fetch(`/api/v1/budget/cost-allocation/${applyRule!.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: applyPeriodStart,
          periodEnd: applyPeriodEnd,
          allocations: applyEntries.map(e => ({
            projectId: e.projectId,
            percentage: e.percentage,
          })),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? t('failedToApply'))
      }

      const json = await res.json()
      setApplyResult(json.data ?? json)
      await loadRules()
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : t('failedToApply'))
    } finally {
      setApplying(false)
    }
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('createRule')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalSharedCosts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(totalSharedCosts)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalRules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('activeRules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{activeRules}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalAllocations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalEntries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">{t('allocationRules')}</TabsTrigger>
          <TabsTrigger value="history">{t('allocationHistory')}</TabsTrigger>
        </TabsList>

        {/* ─── Rules Tab ─── */}
        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('noRules')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  expanded={expandedRuleId === rule.id}
                  onToggleExpand={() =>
                    setExpandedRuleId(prev => prev === rule.id ? null : rule.id)
                  }
                  onEdit={() => openEditDialog(rule)}
                  onToggleActive={() => toggleActive(rule)}
                  onApply={() => openApplyDialog(rule)}
                  formatCurrency={formatCurrency}
                  t={t}
                  tc={tc}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history">
          <AllocationHistorySection
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            t={t}
            tc={tc}
          />
        </TabsContent>
      </Tabs>

      {/* ─── Create/Edit Rule Dialog ─── */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t('editRule') : t('createRule')}
            </DialogTitle>
            <DialogDescription>
              {editingRule ? t('editRuleDescription') : t('createRuleDescription')}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">{t('ruleName')}</Label>
                <Input
                  id="rule-name"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={t('ruleNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-amount">{t('totalAmount')}</Label>
                <Input
                  id="rule-amount"
                  type="number"
                  value={formTotalAmount}
                  onChange={e => {
                    setFormTotalAmount(e.target.value)
                    recalcAllocatedAmounts(Number(e.target.value) || 0)
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">{tc('labels.description')}</Label>
              <Textarea
                id="rule-description"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('frequency')}</Label>
              <SearchableSelect
                options={frequencyOptions}
                value={formFrequency}
                onValueChange={(v) => setFormFrequency(v as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY')}
                placeholder={t('selectFrequency')}
              />
            </div>

            {/* Allocation entries */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('projectAllocations')}</Label>
                <div className="flex items-center gap-2 text-sm">
                  <span className={formPercentageValid ? 'text-green-600' : 'text-destructive'}>
                    {t('totalPercentage')}: {formTotalPercentage.toFixed(1)}%
                  </span>
                  {!formPercentageValid && (
                    <span className="text-destructive text-xs">({t('mustEqual100')})</span>
                  )}
                </div>
              </div>

              {formEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={projectOptions}
                      value={entry.projectId}
                      onValueChange={v => updateEntry(idx, 'projectId', v)}
                      placeholder={t('selectProject')}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={entry.percentage || ''}
                      onChange={e => updateEntry(idx, 'percentage', e.target.value)}
                      placeholder="%"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div className="w-32 text-sm text-muted-foreground text-right font-mono">
                    {formatCurrency(entry.allocatedAmount)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeEntryRow(idx)}
                    disabled={formEntries.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addEntryRow}>
                <Plus className="h-4 w-4 mr-1" />
                {t('addProject')}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSaveRule} disabled={formSaving}>
              {formSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? tc('buttons.save') : tc('buttons.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Apply Allocation Dialog ─── */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('applyAllocation')}</DialogTitle>
            <DialogDescription>
              {applyRule?.name} &mdash; {formatCurrency(Number(applyRule?.totalAmount ?? 0))}
            </DialogDescription>
          </DialogHeader>

          {applyResult ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {t('allocationApplied')}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {t('entriesCreated', { count: applyResult.entries.length })}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('project')}</TableHead>
                    <TableHead className="text-right">{t('percentage')}</TableHead>
                    <TableHead className="text-right">{t('allocatedAmount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applyResult.entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.project.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(entry.percentage).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(entry.allocatedAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <DialogFooter>
                <Button onClick={() => setApplyDialogOpen(false)}>
                  {tc('buttons.close')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {applyError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {applyError}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apply-start">{t('periodStart')}</Label>
                    <Input
                      id="apply-start"
                      type="date"
                      value={applyPeriodStart}
                      onChange={e => setApplyPeriodStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apply-end">{t('periodEnd')}</Label>
                    <Input
                      id="apply-end"
                      type="date"
                      value={applyPeriodEnd}
                      onChange={e => setApplyPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Apply entries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t('projectAllocations')}</Label>
                    <span className={applyPercentageValid ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
                      {t('totalPercentage')}: {applyTotalPercentage.toFixed(1)}%
                    </span>
                  </div>

                  {applyEntries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          options={projectOptions}
                          value={entry.projectId}
                          onValueChange={v => updateApplyEntry(idx, 'projectId', v)}
                          placeholder={t('selectProject')}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={entry.percentage || ''}
                          onChange={e => updateApplyEntry(idx, 'percentage', e.target.value)}
                          placeholder="%"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div className="w-32 text-sm text-muted-foreground text-right font-mono">
                        {formatCurrency(Number(applyRule?.totalAmount ?? 0) * entry.percentage / 100)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeApplyEntry(idx)}
                        disabled={applyEntries.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={addApplyEntry}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addProject')}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                  {tc('buttons.cancel')}
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applying || !applyPercentageValid}
                >
                  {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('applyNow')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Rule Card Sub-component ───

function RuleCard({
  rule,
  expanded,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onApply,
  formatCurrency,
  t,
  tc,
}: {
  rule: AllocationRule
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onToggleActive: () => void
  onApply: () => void
  formatCurrency: (amount: number) => string
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const frequencyLabel =
    rule.frequency === 'MONTHLY' ? t('monthly') :
    rule.frequency === 'QUARTERLY' ? t('quarterly') :
    t('annually')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            onClick={onToggleExpand}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{rule.name}</span>
                <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                  {rule.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')}
                </Badge>
                <Badge variant="outline">{frequencyLabel}</Badge>
              </div>
              {rule.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {rule.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="font-mono font-semibold text-sm">
              {formatCurrency(Number(rule.totalAmount))}
            </span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <Button size="sm" variant="outline" onClick={onEdit}>
              {tc('buttons.edit')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleActive}
            >
              {rule.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-1" />
                  {t('deactivate')}
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-1" />
                  {t('activate')}
                </>
              )}
            </Button>
            {rule.isActive && (
              <Button size="sm" onClick={onApply}>
                <Play className="h-4 w-4 mr-1" />
                {t('applyAllocation')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {t('entriesCount', { count: rule._count?.entries ?? 0 })}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Allocation History Sub-component ───

function AllocationHistorySection({
  formatCurrency,
  formatDate,
  t,
  tc,
}: {
  formatCurrency: (amount: number) => string
  formatDate: (date: string | Date) => string
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // Fetch entries via the main endpoint with a high limit to show history
        const res = await fetch('/api/v1/budget/cost-allocation?limit=100')
        if (!res.ok) throw new Error(t('failedToLoad'))
        const json = await res.json()
        const rules: AllocationRule[] = json.data ?? []

        // Build a combined history by fetching entries for each rule
        // In the absence of a dedicated history endpoint, we display rules with their entry counts
        setHistory([]) // The API does not return entries inline, so we show rule-level summary
        setError('')

        // Store rules as a fallback display
        setRulesForHistory(rules)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoad'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  const [rulesForHistory, setRulesForHistory] = useState<AllocationRule[]>([])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (rulesForHistory.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('noHistory')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('allocationHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('ruleName')}</TableHead>
              <TableHead className="text-right">{t('totalAmount')}</TableHead>
              <TableHead>{t('frequency')}</TableHead>
              <TableHead className="text-center">{tc('labels.status')}</TableHead>
              <TableHead className="text-right">{t('entriesApplied')}</TableHead>
              <TableHead>{t('lastUpdated')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesForHistory.map(rule => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(Number(rule.totalAmount))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {rule.frequency === 'MONTHLY' ? t('monthly') :
                     rule.frequency === 'QUARTERLY' ? t('quarterly') :
                     t('annually')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {rule._count?.entries ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(rule.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
