'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Ban, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SalaryComponent {
  id: string
  name: string
  code: string
  type: string
}

interface StructureLine {
  id?: string
  componentId: string
  calculationType: string
  amount: number | null
  percentage: number | null
  sortOrder: number
  component?: SalaryComponent
}

interface SalaryGrade {
  id: string
  code: string
  name: string
}

interface SalaryStructure {
  id: string
  name: string
  description: string | null
  gradeId: string | null
  isDefault: boolean
  isActive: boolean
  grade: SalaryGrade | null
  lines: StructureLine[]
  _count?: { lines: number }
}

const CALC_TYPES = ['FIXED', 'PERCENT_OF_BASIC', 'PERCENT_OF_GROSS'] as const

export default function SalaryStructuresPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [grades, setGrades] = useState<SalaryGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formGradeId, setFormGradeId] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [formLines, setFormLines] = useState<StructureLine[]>([])

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/v1/hr/salary-structures?limit=100').then(r => r.json()),
      fetch('/api/v1/hr/salary-components?isActive=true').then(r => r.json()),
      fetch('/api/v1/hr/salary-grades?limit=100').then(r => r.json()),
    ])
      .then(([structRes, compRes, gradeRes]) => {
        if (structRes.success) setStructures(structRes.data)
        if (compRes.success) setComponents(compRes.data)
        if (gradeRes.success) setGrades(gradeRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormGradeId('')
    setFormIsDefault(false)
    setFormLines([])
    setEditingStructure(null)
  }

  function openCreateDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(structure: SalaryStructure) {
    setEditingStructure(structure)
    setFormName(structure.name)
    setFormDescription(structure.description || '')
    setFormGradeId(structure.gradeId || '')
    setFormIsDefault(structure.isDefault)
    setFormLines(
      structure.lines.map(l => ({
        componentId: l.componentId,
        calculationType: l.calculationType,
        amount: l.amount ? Number(l.amount) : null,
        percentage: l.percentage ? Number(l.percentage) : null,
        sortOrder: l.sortOrder,
      }))
    )
    setDialogOpen(true)
  }

  function addLine() {
    setFormLines(prev => [
      ...prev,
      { componentId: '', calculationType: 'FIXED', amount: 0, percentage: null, sortOrder: prev.length },
    ])
  }

  function updateLine(index: number, updates: Partial<StructureLine>) {
    setFormLines(prev => prev.map((l, i) => (i === index ? { ...l, ...updates } : l)))
  }

  function removeLine(index: number) {
    setFormLines(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      gradeId: (formGradeId && formGradeId !== 'none') ? formGradeId : null,
      isDefault: formIsDefault,
      lines: formLines
        .filter(l => l.componentId)
        .map((l, i) => ({
          componentId: l.componentId,
          calculationType: l.calculationType,
          amount: l.calculationType === 'FIXED' ? (l.amount ?? 0) : null,
          percentage: l.calculationType !== 'FIXED' ? (l.percentage ?? 0) : null,
          sortOrder: i,
        })),
    }

    try {
      const url = editingStructure
        ? `/api/v1/hr/salary-structures/${editingStructure.id}`
        : '/api/v1/hr/salary-structures'
      const res = await fetch(url, {
        method: editingStructure ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setDialogOpen(false)
        resetForm()
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await fetch(`/api/v1/hr/salary-structures/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  function calcTypeLabel(type: string) {
    switch (type) {
      case 'FIXED': return t('salaryStructures.fixed')
      case 'PERCENT_OF_BASIC': return t('salaryStructures.percentOfBasic')
      case 'PERCENT_OF_GROSS': return t('salaryStructures.percentOfGross')
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('salaryStructures.title')} description={t('salaryStructures.description')}>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />{t('salaryStructures.addStructure')}
        </Button>
      </PageHeader>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tc('labels.loading')}
          </CardContent>
        </Card>
      ) : structures.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('salaryStructures.noStructures')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {structures.map(structure => (
            <Card key={structure.id} className={!structure.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === structure.id ? null : structure.id)}
                      className="hover:bg-muted rounded p-1 transition-colors"
                      aria-label="Toggle details"
                    >
                      {expandedId === structure.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div>
                      <CardTitle className="text-base">{structure.name}</CardTitle>
                      {structure.description && (
                        <p className="text-sm text-muted-foreground mt-1">{structure.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {structure.grade && (
                      <Badge variant="outline">{structure.grade.name}</Badge>
                    )}
                    {structure.isDefault && (
                      <Badge>{t('salaryStructures.isDefault')}</Badge>
                    )}
                    <Badge variant="secondary">
                      {structure._count?.lines ?? structure.lines.length} {t('salaryStructures.components')}
                    </Badge>
                    <StatusBadge status={structure.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(structure)} aria-label={t('salaryStructures.editStructure')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {structure.isActive && (
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDeactivate(structure.id)} aria-label="Deactivate">
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === structure.id && (
                <CardContent>
                  {structure.lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('salaryStructures.noStructures')}</p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('salaryStructures.components')}</TableHead>
                            <TableHead>{t('fields.type')}</TableHead>
                            <TableHead>{t('salaryStructures.calculationType')}</TableHead>
                            <TableHead className="text-right">{t('salaryStructures.amount')} / {t('salaryStructures.percentage')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {structure.lines.map(line => (
                            <TableRow key={line.id}>
                              <TableCell className="font-medium">{line.component?.name || line.componentId}</TableCell>
                              <TableCell>
                                <Badge variant={line.component?.type === 'EARNING' ? 'default' : 'destructive'}>
                                  {line.component?.type || '—'}
                                </Badge>
                              </TableCell>
                              <TableCell>{calcTypeLabel(line.calculationType)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {line.calculationType === 'FIXED'
                                  ? Number(line.amount || 0).toLocaleString()
                                  : `${Number(line.percentage || 0)}%`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStructure ? t('salaryStructures.editStructure') : t('salaryStructures.addStructure')}
            </DialogTitle>
            <DialogDescription>{t('salaryStructures.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="structureName">{t('salaryStructures.name')}</Label>
                <Input
                  id="structureName"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={t('salaryStructures.name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structureGrade">{t('salaryStructures.linkedGrade')}</Label>
                <Select value={formGradeId} onValueChange={setFormGradeId}>
                  <SelectTrigger id="structureGrade">
                    <SelectValue placeholder={t('salaryStructures.linkedGrade')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {grades.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="structureDesc">{t('salaryStructures.description2')}</Label>
              <Textarea
                id="structureDesc"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="structureDefault"
                checked={formIsDefault}
                onCheckedChange={(checked) => setFormIsDefault(!!checked)}
              />
              <Label htmlFor="structureDefault">{t('salaryStructures.isDefault')}</Label>
            </div>

            {/* Component Lines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('salaryStructures.components')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-3 w-3 mr-1" />{t('salaryStructures.addComponent')}
                </Button>
              </div>

              {formLines.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('salaryStructures.addComponent')}
                </p>
              ) : (
                <div className="space-y-2">
                  {formLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <Select value={line.componentId} onValueChange={v => updateLine(idx, { componentId: v })}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('payslip.component')} />
                          </SelectTrigger>
                          <SelectContent>
                            {components.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-40">
                        <Select value={line.calculationType} onValueChange={v => updateLine(idx, { calculationType: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CALC_TYPES.map(ct => (
                              <SelectItem key={ct} value={ct}>{calcTypeLabel(ct)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28">
                        {line.calculationType === 'FIXED' ? (
                          <Input
                            type="number"
                            min={0}
                            value={line.amount ?? ''}
                            onChange={e => updateLine(idx, { amount: e.target.value ? Number(e.target.value) : null })}
                            placeholder={t('salaryStructures.amount')}
                          />
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={line.percentage ?? ''}
                            onChange={e => updateLine(idx, { percentage: e.target.value ? Number(e.target.value) : null })}
                            placeholder="%"
                          />
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLine(idx)} aria-label="Remove">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? tc('labels.loading') : tc('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
