'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Project {
  id: string
  name: string
}

interface Grant {
  id: string
  title: string
  grantNo: string
}

interface FiscalYear {
  id: string
  name: string
}

interface Account {
  id: string
  code: string
  name: string
}

interface BudgetLine {
  accountId: string
  category: string
  description: string
  unit: string
  quantity: string
  unitCost: string
  totalAmount: string
  notes: string
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

function emptyLine(): BudgetLine {
  return {
    accountId: '',
    category: '',
    description: '',
    unit: '',
    quantity: '1',
    unitCost: '0',
    totalAmount: '0',
    notes: '',
  }
}

export default function NewBudgetPage() {
  const router = useRouter()
  const t = useTranslations('budget')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<BudgetLine[]>([emptyLine()])

  // Lookup data
  const [projects, setProjects] = useState<Project[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch('/api/v1/projects?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})

    fetch('/api/v1/donors/grants?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setGrants(json.data) })
      .catch(() => {})

    fetch('/api/v1/finance/fiscal-years?limit=50')
      .then(res => res.json())
      .then(json => { if (json.success) setFiscalYears(json.data) })
      .catch(() => {})

    fetch('/api/v1/finance/chart-of-accounts?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setAccounts(json.data) })
      .catch(() => {})
  }, [])

  function updateLine(index: number, field: keyof BudgetLine, value: string) {
    setLines(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // Auto-calculate totalAmount when quantity or unitCost changes
      if (field === 'quantity' || field === 'unitCost') {
        const qty = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0
        const cost = parseFloat(field === 'unitCost' ? value : updated[index].unitCost) || 0
        updated[index].totalAmount = String(Math.round(qty * cost * 100) / 100)
      }
      return updated
    })
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()])
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const lineTotal = lines.reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0)

  function validate(): boolean {
    if (!name.trim() || !projectId || !fiscalYearId) {
      setError(t('form.requiredFields'))
      return false
    }
    const amt = parseFloat(totalAmount)
    if (!totalAmount || isNaN(amt) || amt <= 0) {
      setError(t('form.amountMustBePositive'))
      return false
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.accountId || !line.category || !line.description.trim()) {
        setError(t('form.lineRequired', { line: i + 1 }))
        return false
      }
      if (!line.totalAmount || parseFloat(line.totalAmount) <= 0) {
        setError(t('form.lineAmountPositive', { line: i + 1 }))
        return false
      }
    }
    if (Math.abs(lineTotal - amt) > 0.01) {
      setError(t('form.lineTotalMismatch'))
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      projectId,
      grantId: grantId || undefined,
      fiscalYearId,
      totalAmount: parseFloat(totalAmount),
      currencyCode,
      notes: notes.trim() || undefined,
      lines: lines.map(l => ({
        accountId: l.accountId,
        category: l.category,
        description: l.description.trim(),
        unit: l.unit || undefined,
        quantity: parseFloat(l.quantity) || 1,
        unitCost: parseFloat(l.unitCost) || 0,
        totalAmount: parseFloat(l.totalAmount),
        notes: l.notes.trim() || undefined,
      })),
    }

    try {
      const res = await fetch('/api/v1/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/budget/${json.data.id}`)
      } else {
        setError(json.error || t('form.failedToCreate'))
      }
    } catch {
      setError(t('form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('form.createTitle')} description={t('form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/budget')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
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

          {/* Row 1: Name + Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-name">{t('name')} *</Label>
              <Input
                id="budget-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-project">{t('project')} *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="budget-project" className="w-full">
                  <SelectValue placeholder={t('form.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Grant + Fiscal Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-grant">{t('grant')}</Label>
              <Select value={grantId} onValueChange={setGrantId}>
                <SelectTrigger id="budget-grant" className="w-full">
                  <SelectValue placeholder={t('form.selectGrant')} />
                </SelectTrigger>
                <SelectContent>
                  {grants.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.grantNo} - {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-fiscal-year">{t('form.fiscalYear')} *</Label>
              <Select value={fiscalYearId} onValueChange={setFiscalYearId}>
                <SelectTrigger id="budget-fiscal-year" className="w-full">
                  <SelectValue placeholder={t('form.selectFiscalYear')} />
                </SelectTrigger>
                <SelectContent>
                  {fiscalYears.map((fy) => (
                    <SelectItem key={fy.id} value={fy.id}>{fy.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Total Amount + Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-total">{t('totalAmount')} *</Label>
              <Input
                id="budget-total"
                type="number"
                min="0.01"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-currency">{t('form.currency')}</Label>
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger id="budget-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="budget-notes">{t('form.notes')}</Label>
            <Textarea
              id="budget-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Lines */}
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
          {lines.map((line, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('form.lineNumber', { number: index + 1 })}
                </span>
                {lines.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.account')} *</Label>
                  <Select value={line.accountId} onValueChange={(v) => updateLine(index, 'accountId', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('form.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('form.category')} *</Label>
                  <Select value={line.category} onValueChange={(v) => updateLine(index, 'category', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('form.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('form.description')} *</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    placeholder={t('form.descriptionPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.unit')}</Label>
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(index, 'unit', e.target.value)}
                    placeholder={t('form.unitPlaceholder')}
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
                  <Label>{t('form.lineTotal')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.totalAmount}
                    onChange={(e) => updateLine(index, 'totalAmount', e.target.value)}
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
            </div>
          ))}

          {/* Line total summary */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium text-muted-foreground">{t('form.lineSum')}</span>
            <span className="text-lg font-bold font-mono">{formatCurrency(lineTotal)}</span>
          </div>
          {totalAmount && Math.abs(lineTotal - parseFloat(totalAmount)) > 0.01 && (
            <div className="text-sm text-destructive">
              {t('form.lineTotalMismatch')}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/budget')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              t('form.saveDraft')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
