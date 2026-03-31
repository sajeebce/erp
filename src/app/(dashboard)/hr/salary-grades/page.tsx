'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Layers, TrendingUp, Hash, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SalaryStep {
  id?: string
  stepNumber: number
  basicSalary: number
}

interface SalaryGrade {
  id: string
  code: string
  name: string
  level: number
  description?: string | null
  minSalary: number
  midSalary: number
  maxSalary: number
  currency: string
  effectiveFrom: string
  effectiveTo?: string | null
  status: string
  steps: SalaryStep[]
}

interface GradeForm {
  code: string
  name: string
  level: number
  description: string
  minSalary: number
  midSalary: number
  maxSalary: number
  currency: string
  effectiveFrom: string
  steps: SalaryStep[]
}

const emptyForm: GradeForm = {
  code: '',
  name: '',
  level: 1,
  description: '',
  minSalary: 0,
  midSalary: 0,
  maxSalary: 0,
  currency: 'BDT',
  effectiveFrom: new Date().toISOString().split('T')[0],
  steps: [
    { stepNumber: 1, basicSalary: 0 },
    { stepNumber: 2, basicSalary: 0 },
    { stepNumber: 3, basicSalary: 0 },
  ],
}

export default function SalaryGradesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [grades, setGrades] = useState<SalaryGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<SalaryGrade | null>(null)
  const [form, setForm] = useState<GradeForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchGrades = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/hr/salary-grades')
      .then(res => res.json())
      .then(json => { if (json.success) setGrades(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchGrades() }, [fetchGrades])

  // KPI calculations
  const activeGrades = grades.filter(g => g.status === 'ACTIVE')
  const totalSteps = grades.reduce((sum, g) => sum + (g.steps?.length || 0), 0)
  const maxSalary = grades.length > 0 ? Math.max(...grades.map(g => g.maxSalary)) : 0

  function openCreateDialog() {
    setEditingGrade(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(grade: SalaryGrade) {
    setEditingGrade(grade)
    setForm({
      code: grade.code,
      name: grade.name,
      level: grade.level,
      description: grade.description || '',
      minSalary: grade.minSalary,
      midSalary: grade.midSalary,
      maxSalary: grade.maxSalary,
      currency: grade.currency,
      effectiveFrom: grade.effectiveFrom?.split('T')[0] || '',
      steps: grade.steps?.length > 0
        ? grade.steps.map(s => ({ ...s }))
        : [{ stepNumber: 1, basicSalary: 0 }, { stepNumber: 2, basicSalary: 0 }, { stepNumber: 3, basicSalary: 0 }],
    })
    setDialogOpen(true)
  }

  function addStep() {
    setForm(prev => ({
      ...prev,
      steps: [...prev.steps, { stepNumber: prev.steps.length + 1, basicSalary: 0 }],
    }))
  }

  function removeStep(index: number) {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })),
    }))
  }

  function updateStep(index: number, field: 'stepNumber' | 'basicSalary', value: number) {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingGrade
        ? `/api/v1/hr/salary-grades/${editingGrade.id}`
        : '/api/v1/hr/salary-grades'
      const method = editingGrade ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setDialogOpen(false)
        fetchGrades()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/v1/hr/salary-grades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      })
      const json = await res.json()
      if (json.success) fetchGrades()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteConfirmId(null)
    }
  }

  function getSalaryColor(value: number, mid: number, max: number) {
    if (value >= max * 0.9) return 'text-amber-600 dark:text-amber-400'
    if (value <= mid) return 'text-emerald-600 dark:text-emerald-400'
    return ''
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('salaryGrades.title')} description={t('salaryGrades.description')}>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />{t('salaryGrades.addGrade')}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Total Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : grades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('salaryGrades.active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : activeGrades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Total {t('salaryGrades.steps')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : totalSteps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('salaryGrades.maxSalary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : formatCurrency(maxSalary)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Matrix Table */}
      {loading ? (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : grades.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('salaryGrades.noGrades')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('salaryGrades.gradeMatrix')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>{t('salaryGrades.code')}</TableHead>
                    <TableHead>{t('salaryGrades.name')}</TableHead>
                    <TableHead className="text-center">{t('salaryGrades.level')}</TableHead>
                    <TableHead className="text-right">{t('salaryGrades.minSalary')}</TableHead>
                    <TableHead className="text-right">{t('salaryGrades.midSalary')}</TableHead>
                    <TableHead className="text-right">{t('salaryGrades.maxSalary')}</TableHead>
                    <TableHead className="text-center">{t('salaryGrades.steps')}</TableHead>
                    <TableHead>{tc('labels.status')}</TableHead>
                    <TableHead className="text-right">{tc('labels.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <>
                      <TableRow
                        key={grade.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedId(expandedId === grade.id ? null : grade.id)}
                      >
                        <TableCell>
                          {grade.steps?.length > 0 && (
                            expandedId === grade.id
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-medium text-sm">{grade.code}</TableCell>
                        <TableCell className="font-medium">{grade.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{grade.level}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${getSalaryColor(grade.minSalary, grade.midSalary, grade.maxSalary)}`}>
                          {formatCurrency(grade.minSalary, grade.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(grade.midSalary, grade.currency)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${getSalaryColor(grade.maxSalary, grade.midSalary, grade.maxSalary)}`}>
                          {formatCurrency(grade.maxSalary, grade.currency)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{grade.steps?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={grade.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => { e.stopPropagation(); openEditDialog(grade) }}
                              aria-label={t('salaryGrades.editGrade')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(grade.id) }}
                              aria-label={t('salaryGrades.deleteGrade')}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Steps Row */}
                      {expandedId === grade.id && grade.steps?.length > 0 && (
                        <TableRow key={`${grade.id}-steps`}>
                          <TableCell colSpan={10} className="bg-muted/30 p-0">
                            <div className="px-8 py-4">
                              <p className="text-sm font-medium mb-3">{t('salaryGrades.steps')} — {grade.name}</p>
                              <div className="rounded-md border bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-24">{t('salaryGrades.stepNumber')}</TableHead>
                                      <TableHead className="text-right">{t('salaryGrades.basicSalary')}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {grade.steps
                                      .sort((a, b) => a.stepNumber - b.stepNumber)
                                      .map(step => (
                                        <TableRow key={step.id || step.stepNumber}>
                                          <TableCell className="font-mono">{step.stepNumber}</TableCell>
                                          <TableCell className={`text-right font-mono text-sm ${getSalaryColor(step.basicSalary, grade.midSalary, grade.maxSalary)}`}>
                                            {formatCurrency(step.basicSalary, grade.currency)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? t('salaryGrades.editGrade') : t('salaryGrades.addGrade')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('salaryGrades.code')}</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('salaryGrades.name')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">{t('salaryGrades.level')}</Label>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  value={form.level}
                  onChange={e => setForm(prev => ({ ...prev, level: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t('salaryGrades.currency')}</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSalary">{t('salaryGrades.minSalary')}</Label>
                <Input
                  id="minSalary"
                  type="number"
                  min={0}
                  value={form.minSalary || ''}
                  onChange={e => setForm(prev => ({ ...prev, minSalary: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="midSalary">{t('salaryGrades.midSalary')}</Label>
                <Input
                  id="midSalary"
                  type="number"
                  min={0}
                  value={form.midSalary || ''}
                  onChange={e => setForm(prev => ({ ...prev, midSalary: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary">{t('salaryGrades.maxSalary')}</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  min={0}
                  value={form.maxSalary || ''}
                  onChange={e => setForm(prev => ({ ...prev, maxSalary: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">{t('salaryGrades.effectiveFrom')}</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={form.effectiveFrom}
                  onChange={e => setForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Steps Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">{t('salaryGrades.steps')}</Label>
                <Button type="button" variant="outline" size="xs" onClick={addStep}>
                  <Plus className="h-3 w-3 mr-1" />{t('salaryGrades.addStep')}
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">{t('salaryGrades.stepNumber')}</TableHead>
                      <TableHead>{t('salaryGrades.basicSalary')}</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.steps.map((step, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={step.stepNumber}
                            onChange={e => updateStep(index, 'stepNumber', Number(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={step.basicSalary || ''}
                            onChange={e => updateStep(index, 'basicSalary', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          {form.steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeStep(index)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {tc('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? tc('labels.loading') : editingGrade ? tc('buttons.save') : tc('buttons.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salaryGrades.deleteGrade')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate this salary grade? This will not delete the grade but mark it as inactive.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {tc('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDeactivate(deleteConfirmId)}>
              {t('salaryGrades.deleteGrade')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
