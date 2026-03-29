'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Send, CheckCircle, XCircle, Play, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useFormatters } from '@/hooks/use-formatters'

interface BudgetLineData {
  id: string
  accountId: string
  account?: { id: string; code: string; name: string }
  category: string
  subCategory: string | null
  description: string
  unit: string | null
  quantity: number | string
  unitCost: number | string
  totalAmount: number | string
  levelOfEffort: number | string | null
  duration: number | null
  donorShare: number | string | null
  costShare: number | string | null
  narrative: string | null
  notes: string | null
}

interface BudgetData {
  id: string
  budgetCode: string
  name: string
  budgetType: string
  projectId: string
  project?: { id: string; name: string; projectNo?: string }
  grantId: string | null
  grant?: { id: string; title: string; grantNo?: string } | null
  fiscalYearId: string
  fiscalYear?: { id: string; name: string; startDate: string; endDate: string }
  startDate: string | null
  endDate: string | null
  periodType: string
  totalAmount: number | string
  currencyCode: string
  exchangeRate: number | string | null
  status: string
  version: number
  indirectCostRate: number | string | null
  indirectCostBase: string | null
  indirectCostAmount: number | string | null
  costShareRequired: boolean
  costSharePercent: number | string | null
  costShareAmount: number | string | null
  donorAmount: number | string | null
  budgetCeiling: number | string | null
  varianceThreshold: number | string
  narrative: string | null
  assumptions: string | null
  approvedById: string | null
  approvedAt: string | null
  notes: string | null
  lines: BudgetLineData[]
  _count?: { revisions: number }
  createdAt: string
  updatedAt: string
}

interface EditLine {
  accountId: string
  category: string
  subCategory: string
  description: string
  unit: string
  quantity: string
  unitCost: string
  totalAmount: string
  levelOfEffort: string
  duration: string
  donorShare: string
  costShare: string
  narrative: string
  notes: string
}

interface Account {
  id: string
  code: string
  name: string
}

const CATEGORIES = [
  'Personnel',
  'Operations',
  'Equipment',
  'Travel',
  'Training',
  'Admin',
  'M&E',
  'Contingency',
] as const

function emptyLine(): EditLine {
  return {
    accountId: '',
    category: '',
    subCategory: '',
    description: '',
    unit: '',
    quantity: '1',
    unitCost: '0',
    totalAmount: '0',
    levelOfEffort: '',
    duration: '',
    donorShare: '',
    costShare: '',
    narrative: '',
    notes: '',
  }
}

export default function BudgetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('budget')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formTotalAmount, setFormTotalAmount] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formLines, setFormLines] = useState<EditLine[]>([emptyLine()])

  // Lookup data
  const [accounts, setAccounts] = useState<Account[]>([])

  const fetchBudget = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/budget/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setBudget(json.data)
      } else {
        setError(json.error || t('form.failedToLoad'))
      }
    } catch {
      setError(t('form.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

  useEffect(() => {
    fetch('/api/v1/finance/accounts?isGroup=false&limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setAccounts(json.data) })
      .catch(() => {})
  }, [])

  function startEditing() {
    if (!budget) return
    setFormName(budget.name)
    setFormTotalAmount(String(budget.totalAmount))
    setFormNotes(budget.notes || '')
    setFormLines(
      budget.lines.map(l => ({
        accountId: l.accountId,
        category: l.category,
        subCategory: l.subCategory || '',
        description: l.description,
        unit: l.unit || '',
        quantity: String(l.quantity),
        unitCost: String(l.unitCost),
        totalAmount: String(l.totalAmount),
        levelOfEffort: l.levelOfEffort ? String(l.levelOfEffort) : '',
        duration: l.duration ? String(l.duration) : '',
        donorShare: l.donorShare ? String(l.donorShare) : '',
        costShare: l.costShare ? String(l.costShare) : '',
        narrative: l.narrative || '',
        notes: l.notes || '',
      }))
    )
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function updateLine(index: number, field: keyof EditLine, value: string) {
    setFormLines(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unitCost') {
        const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0
        const cost = parseFloat(field === 'unitCost' ? value : updated[index].unitCost) || 0
        updated[index].totalAmount = String(Math.round(qty * cost * 100) / 100)
      }
      return updated
    })
  }

  function addLine() {
    setFormLines(prev => [...prev, emptyLine()])
  }

  function removeLine(index: number) {
    if (formLines.length <= 1) return
    setFormLines(prev => prev.filter((_, i) => i !== index))
  }

  const formLineTotal = formLines.reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0)

  function validate(): boolean {
    if (!formName.trim()) {
      setError(t('form.requiredFields'))
      return false
    }
    const amt = parseFloat(formTotalAmount)
    if (!formTotalAmount || isNaN(amt) || amt <= 0) {
      setError(t('form.amountMustBePositive'))
      return false
    }
    for (let i = 0; i < formLines.length; i++) {
      const line = formLines[i]
      if (!line.accountId || !line.category || !line.description.trim()) {
        setError(t('form.lineRequired', { line: i + 1 }))
        return false
      }
      if (!line.totalAmount || parseFloat(line.totalAmount) <= 0) {
        setError(t('form.lineAmountPositive', { line: i + 1 }))
        return false
      }
    }
    if (Math.abs(formLineTotal - amt) > 0.01) {
      setError(t('form.lineTotalMismatch'))
      return false
    }
    setError('')
    return true
  }

  async function handleUpdate() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload = {
      name: formName.trim(),
      totalAmount: parseFloat(formTotalAmount),
      notes: formNotes.trim() || null,
      lines: formLines.map(l => ({
        accountId: l.accountId,
        category: l.category,
        subCategory: l.subCategory || null,
        description: l.description.trim(),
        unit: l.unit || null,
        quantity: parseFloat(l.quantity) || 1,
        unitCost: parseFloat(l.unitCost) || 0,
        totalAmount: parseFloat(l.totalAmount),
        levelOfEffort: l.levelOfEffort ? parseFloat(l.levelOfEffort) : null,
        duration: l.duration ? parseInt(l.duration) : null,
        donorShare: l.donorShare ? parseFloat(l.donorShare) : null,
        costShare: l.costShare ? parseFloat(l.costShare) : null,
        narrative: l.narrative.trim() || null,
        notes: l.notes.trim() || null,
      })),
    }

    try {
      const res = await fetch(`/api/v1/budget/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchBudget()
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
    try {
      const res = await fetch(`/api/v1/budget/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/budget')
      } else {
        setError(json.error || t('form.failedToDelete'))
      }
    } catch {
      setError(t('form.failedToDelete'))
    }
  }

  async function handleStatusChange(action: string, reason?: string) {
    setError('')
    try {
      const res = await fetch(`/api/v1/budget/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await fetchBudget()
      } else {
        setError(json.error || `Failed to ${action} budget`)
      }
    } catch {
      setError(`Failed to ${action} budget`)
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (no data)
  if (error && !budget) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('form.budgetDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/budget')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!budget) return null

  const isDraft = budget.status === 'DRAFT'

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={budget.name}
          description={`${budget.budgetCode} \u2022 ${t(`budgetType.${budget.budgetType}`)}`}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/budget')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Budget Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {budget.name}
                <StatusBadge status={budget.status} />
              </CardTitle>
              <Badge variant="outline">v{budget.version}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('budgetCode')} value={budget.budgetCode} />
              <DetailItem label={t('budgetType.label')} value={t(`budgetType.${budget.budgetType}`)} />
              <DetailItem label={t('project')} value={budget.project?.name} />
              {budget.grant && (
                <DetailItem label={t('grant')} value={`${budget.grant.grantNo || ''} ${budget.grant.title}`} />
              )}
              {budget.fiscalYear && (
                <DetailItem label={t('form.fiscalYear')} value={budget.fiscalYear.name} />
              )}
              <DetailItem label={t('totalAmount')} value={formatCurrency(Number(budget.totalAmount))} />
              <DetailItem label={t('form.currency')} value={budget.currencyCode} />
              {budget.exchangeRate && (
                <DetailItem label={t('form.exchangeRate')} value={String(budget.exchangeRate)} />
              )}
              <DetailItem label={t('periodType.label')} value={t(`periodType.${budget.periodType}`)} />
              {budget.startDate && (
                <DetailItem label={t('form.startDate')} value={formatDate(budget.startDate)} />
              )}
              {budget.endDate && (
                <DetailItem label={t('form.endDate')} value={formatDate(budget.endDate)} />
              )}
              <DetailItem label={t('form.createdAt')} value={formatDate(budget.createdAt)} />
              <DetailItem label={t('form.updatedAt')} value={formatDate(budget.updatedAt)} />
              {budget._count && (
                <DetailItem label={t('form.revisions')} value={String(budget._count.revisions)} />
              )}
            </div>

            {/* ICR Section */}
            {budget.indirectCostRate && Number(budget.indirectCostRate) > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('indirectCost.title')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem label={t('indirectCost.rate')} value={`${budget.indirectCostRate}%`} />
                    <DetailItem label={t('indirectCost.base')} value={budget.indirectCostBase ? t(`indirectCost.${budget.indirectCostBase}`) : '\u2014'} />
                    <DetailItem label={t('indirectCost.amount')} value={formatCurrency(Number(budget.indirectCostAmount || 0))} />
                  </div>
                </div>
              </>
            )}

            {/* Cost Sharing Section */}
            {budget.costShareRequired && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('costShare.title')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem label={t('costShare.percent')} value={`${budget.costSharePercent}%`} />
                    <DetailItem label={t('costShare.amount')} value={formatCurrency(Number(budget.costShareAmount || 0))} />
                    <DetailItem label={t('costShare.donorAmount')} value={formatCurrency(Number(budget.donorAmount || 0))} />
                  </div>
                </div>
              </>
            )}

            {/* Controls */}
            {(budget.budgetCeiling || Number(budget.varianceThreshold) !== 10) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">{t('controls.title')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {budget.budgetCeiling && (
                      <DetailItem label={t('controls.ceiling')} value={formatCurrency(Number(budget.budgetCeiling))} />
                    )}
                    <DetailItem label={t('controls.varianceThreshold')} value={`${budget.varianceThreshold}%`} />
                  </div>
                </div>
              </>
            )}

            {/* Narratives */}
            {(budget.narrative || budget.assumptions) && (
              <>
                <Separator />
                <div className="space-y-3">
                  {budget.narrative && (
                    <div className="space-y-1">
                      <span className="text-sm font-semibold">{t('narratives.narrative')}</span>
                      <p className="text-sm whitespace-pre-wrap">{budget.narrative}</p>
                    </div>
                  )}
                  {budget.assumptions && (
                    <div className="space-y-1">
                      <span className="text-sm font-semibold">{t('narratives.assumptions')}</span>
                      <p className="text-sm whitespace-pre-wrap">{budget.assumptions}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {budget.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('form.notes')}</span>
                <p className="text-sm">{budget.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Lines Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.budgetLines')} ({budget.lines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">{t('form.category')}</th>
                    <th className="text-left py-2 px-3 font-medium">{t('form.account')}</th>
                    <th className="text-left py-2 px-3 font-medium">{t('form.description')}</th>
                    <th className="text-left py-2 px-3 font-medium">{t('form.unit')}</th>
                    <th className="text-right py-2 px-3 font-medium">{t('form.quantity')}</th>
                    <th className="text-right py-2 px-3 font-medium">{t('form.unitCost')}</th>
                    {budget.lines.some(l => l.levelOfEffort) && (
                      <th className="text-right py-2 px-3 font-medium">{t('form.levelOfEffort')}</th>
                    )}
                    {budget.lines.some(l => l.duration) && (
                      <th className="text-right py-2 px-3 font-medium">{t('form.duration')}</th>
                    )}
                    <th className="text-right py-2 px-3 font-medium">{t('form.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.lines.map((line) => (
                    <tr key={line.id} className="border-b last:border-0 group">
                      <td className="py-2 px-3">
                        <Badge variant="secondary">{line.category}</Badge>
                        {line.subCategory && (
                          <span className="text-xs text-muted-foreground ml-1">{line.subCategory}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {line.account && (
                          <div>
                            <div className="font-medium">{line.account.name}</div>
                            <div className="text-xs text-muted-foreground">{line.account.code}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div>{line.description}</div>
                        {line.narrative && (
                          <div className="text-xs text-muted-foreground mt-1 italic">{line.narrative}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">{line.unit || '\u2014'}</td>
                      <td className="py-2 px-3 text-right font-mono">{Number(line.quantity)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(line.unitCost))}</td>
                      {budget.lines.some(l => l.levelOfEffort) && (
                        <td className="py-2 px-3 text-right font-mono">
                          {line.levelOfEffort ? `${line.levelOfEffort}%` : '\u2014'}
                        </td>
                      )}
                      {budget.lines.some(l => l.duration) && (
                        <td className="py-2 px-3 text-right font-mono">
                          {line.duration || '\u2014'}
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-mono font-medium">{formatCurrency(Number(line.totalAmount))}</td>
                    </tr>
                  ))}
                  {/* ICR row */}
                  {budget.indirectCostAmount && Number(budget.indirectCostAmount) > 0 && (
                    <tr className="border-b bg-muted/30">
                      <td colSpan={budget.lines.some(l => l.levelOfEffort) ? 7 : 6} className="py-2 px-3 text-right text-sm italic text-muted-foreground">
                        {t('indirectCost.title')} ({budget.indirectCostRate}%)
                      </td>
                      <td className={`py-2 px-3 text-right font-mono ${budget.lines.some(l => l.duration) ? '' : ''}`} colSpan={budget.lines.some(l => l.duration) ? 2 : 1}>
                        {formatCurrency(Number(budget.indirectCostAmount))}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-muted/50 font-semibold">
                    <td colSpan={budget.lines.some(l => l.levelOfEffort) && budget.lines.some(l => l.duration) ? 8 : budget.lines.some(l => l.levelOfEffort) || budget.lines.some(l => l.duration) ? 7 : 6} className="py-2 px-3 text-right">{t('totalAmount')}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(budget.totalAmount))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Action Buttons */}
        <Card>
          <CardContent className="flex flex-wrap gap-3 pt-6">
            {/* DRAFT: Edit, Submit for Approval, Delete */}
            {budget.status === 'DRAFT' && (
              <>
                <Button onClick={startEditing}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {tc('buttons.edit')}
                </Button>

                <Button variant="default" onClick={() => handleStatusChange('submit')}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Approval
                </Button>

                <ConfirmDialog
                  trigger={
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {tc('buttons.delete')}
                    </Button>
                  }
                  title={tc('buttons.delete')}
                  description={t('form.confirmDelete')}
                  confirmText={tc('buttons.delete')}
                  variant="destructive"
                  onConfirm={handleDelete}
                />
              </>
            )}

            {/* SUBMITTED: Approve, Reject (send back to DRAFT) */}
            {budget.status === 'SUBMITTED' && (
              <>
                <Button variant="default" onClick={() => handleStatusChange('approve')} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Budget
                </Button>

                <ConfirmDialog
                  trigger={
                    <Button variant="outline">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject (Send Back)
                    </Button>
                  }
                  title="Reject Budget"
                  description="This will send the budget back to DRAFT status. The creator can make changes and resubmit. Please provide a reason."
                  confirmText="Reject"
                  variant="destructive"
                  onConfirm={() => handleStatusChange('reject', 'Needs revision per reviewer feedback')}
                />
              </>
            )}

            {/* APPROVED: Activate */}
            {budget.status === 'APPROVED' && (
              <Button variant="default" onClick={() => handleStatusChange('activate')}>
                <Play className="h-4 w-4 mr-2" />
                Activate Budget
              </Button>
            )}

            {/* ACTIVE: Close */}
            {budget.status === 'ACTIVE' && (
              <ConfirmDialog
                trigger={
                  <Button variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Close Budget
                  </Button>
                }
                title="Close Budget"
                description="Closing this budget will lock it permanently. No further transactions can be posted against it. This action cannot be undone."
                confirmText="Close Budget"
                variant="destructive"
                onConfirm={() => handleStatusChange('close')}
              />
            )}

            {/* Status workflow info */}
            <div className="w-full mt-2 text-xs text-muted-foreground">
              Workflow: DRAFT → SUBMITTED → APPROVED → ACTIVE → CLOSED
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('form.editTitle')}
        description={budget.name}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.budgetDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-budget-name">{t('name')} *</Label>
              <Input
                id="edit-budget-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-budget-total">{t('totalAmount')} *</Label>
              <Input
                id="edit-budget-total"
                type="number"
                min="0.01"
                step="0.01"
                value={formTotalAmount}
                onChange={(e) => setFormTotalAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-budget-notes">{t('form.notes')}</Label>
            <Textarea
              id="edit-budget-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Budget Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('form.budgetLines')}</CardTitle>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              {t('form.addLine')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formLines.map((line, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('form.lineNumber', { number: index + 1 })}
                </span>
                {formLines.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.account')} *</Label>
                  <SearchableSelect
                    id={`edit-line-${index}-account`}
                    options={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                    value={line.accountId}
                    onValueChange={(v) => updateLine(index, 'accountId', v)}
                    placeholder={t('form.selectAccount')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.category')} *</Label>
                  <SearchableSelect
                    id={`edit-line-${index}-category`}
                    options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                    value={line.category}
                    onValueChange={(v) => updateLine(index, 'category', v)}
                    placeholder={t('form.selectCategory')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.description')} *</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.unit')}</Label>
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(index, 'unit', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.quantity')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.unitCost')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(e) => updateLine(index, 'unitCost', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.levelOfEffort')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={line.levelOfEffort}
                    onChange={(e) => updateLine(index, 'levelOfEffort', e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.duration')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.duration}
                    onChange={(e) => updateLine(index, 'duration', e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.lineTotal')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.totalAmount}
                    onChange={(e) => updateLine(index, 'totalAmount', e.target.value)}
                    className="font-mono font-medium"
                  />
                </div>
              </div>

              {/* Narrative */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('form.lineNarrative')}</Label>
                <Textarea
                  value={line.narrative}
                  onChange={(e) => updateLine(index, 'narrative', e.target.value)}
                  placeholder={t('form.lineNarrativePlaceholder')}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('form.lineNotes')}</Label>
                <Input
                  value={line.notes}
                  onChange={(e) => updateLine(index, 'notes', e.target.value)}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium text-muted-foreground">{t('form.lineSum')}</span>
            <span className="text-lg font-bold font-mono">{formatCurrency(formLineTotal)}</span>
          </div>
          {formTotalAmount && Math.abs(formLineTotal - parseFloat(formTotalAmount)) > 0.01 && (
            <div className="text-sm text-destructive">
              {t('form.lineTotalMismatch')}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              tc('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children ? (
        <div>{children}</div>
      ) : (
        <p className="text-sm font-medium">{value || '\u2014'}</p>
      )}
    </div>
  )
}
