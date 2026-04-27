'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronUp,
  Calculator, FileText, Shield, DollarSign, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Project {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  code: string
}

interface CostCenter {
  id: string
  name: string
  code: string
  businessUnitId?: string
}

interface BusinessUnit {
  id: string
  code: string
  name: string
  shortName: string | null
}

interface FundClass {
  id: string
  code: string
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
  startDate: string
  endDate: string
}

interface Account {
  id: string
  code: string
  name: string
}

interface BudgetLine {
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

const SUB_CATEGORIES: Record<string, string[]> = {
  Personnel: ['International Staff', 'National Staff', 'Consultants', 'Volunteers', 'Fringe Benefits'],
  Operations: ['Office Supplies', 'Communications', 'Utilities', 'Insurance', 'Bank Charges'],
  Equipment: ['IT Equipment', 'Field Equipment', 'Vehicles', 'Furniture'],
  Travel: ['International Travel', 'Domestic Travel', 'Per Diem', 'Ground Transport'],
  Training: ['Workshops', 'Materials', 'Venue & Catering', 'Facilitators'],
  Admin: ['Office Rent', 'Audit Fees', 'Legal Services', 'Publications'],
  'M&E': ['Surveys', 'Evaluations', 'Data Collection', 'Reporting'],
  Contingency: ['General Contingency'],
}

const BUDGET_TYPES = [
  { value: 'PROJECT', label: 'budgetType.PROJECT' },
  { value: 'CORE', label: 'budgetType.CORE' },
  { value: 'PROGRAM', label: 'budgetType.PROGRAM' },
  { value: 'OPERATIONAL', label: 'budgetType.OPERATIONAL' },
  { value: 'PROPOSAL', label: 'budgetType.PROPOSAL' },
] as const

const PERIOD_TYPES = [
  { value: 'MONTHLY', label: 'periodType.MONTHLY' },
  { value: 'QUARTERLY', label: 'periodType.QUARTERLY' },
  { value: 'SEMI_ANNUAL', label: 'periodType.SEMI_ANNUAL' },
  { value: 'ANNUAL', label: 'periodType.ANNUAL' },
] as const

const ICR_BASES = [
  { value: 'TOTAL_DIRECT', label: 'indirectCost.TOTAL_DIRECT' },
  { value: 'MTDC', label: 'indirectCost.MTDC' },
  { value: 'PERSONNEL', label: 'indirectCost.PERSONNEL' },
] as const

function emptyLine(): BudgetLine {
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

export default function NewBudgetPage() {
  const router = useRouter()
  const t = useTranslations('budget')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Section 1: Budget Header
  const [name, setName] = useState('')
  const [budgetType, setBudgetType] = useState('PROJECT')
  const [projectId, setProjectId] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [fundClassId, setFundClassId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [fiscalYearId, setFiscalYearId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [periodType, setPeriodType] = useState('ANNUAL')
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [exchangeRate, setExchangeRate] = useState('')
  const [notes, setNotes] = useState('')

  // Section 2: ICR (Indirect Cost Rate)
  const [indirectCostRate, setIndirectCostRate] = useState('')
  const [indirectCostBase, setIndirectCostBase] = useState('')

  // Section 3: Cost Sharing
  const [costShareRequired, setCostShareRequired] = useState(false)
  const [costSharePercent, setCostSharePercent] = useState('')

  // Section 4: Controls
  const [budgetCeiling, setBudgetCeiling] = useState('')
  const [varianceThreshold, setVarianceThreshold] = useState('10')

  // Section 5: Narratives
  const [narrative, setNarrative] = useState('')
  const [assumptions, setAssumptions] = useState('')

  // Section 6: Budget Lines
  const [lines, setLines] = useState<BudgetLine[]>([emptyLine()])

  // Collapsible sections
  const [icrOpen, setIcrOpen] = useState(false)
  const [costShareOpen, setCostShareOpen] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [narrativesOpen, setNarrativesOpen] = useState(false)

  // Lookup data
  const [projects, setProjects] = useState<Project[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [fundClasses, setFundClasses] = useState<FundClass[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  useEffect(() => {
    const errors: string[] = []
    let completed = 0
    const total = 4

    function checkDone() {
      completed++
      if (completed === total) {
        setLoadErrors(errors)
        setLoadingData(false)
      }
    }

    const fetchWithAuth = (url: string, label: string) =>
      fetch(url)
        .then(res => {
          if (res.status === 401) { errors.push(`${label} (${t('form.loginRequired')})`); return null }
          return res.json()
        })
        .then(json => {
          if (!json) return
          if (json.success) return json.data
          errors.push(label)
          return []
        })
        .catch(() => { errors.push(label); return [] })

    Promise.all([
      fetchWithAuth('/api/v1/projects?limit=200', 'Projects').then(d => d && setProjects(d)),
      fetchWithAuth('/api/v1/settings/business-units?limit=200', 'Business Units').then(d => d && setBusinessUnits(d)),
      fetchWithAuth('/api/v1/hr/departments?limit=200', 'Departments').then(d => d && setDepartments(d)),
      fetchWithAuth('/api/v1/settings/cost-centers?limit=200', 'Cost Centers').then(d => d && setCostCenters(d)),
      fetchWithAuth('/api/v1/settings/fund-classes?limit=200', 'Fund Classes').then(d => d && setFundClasses(d)),
      fetchWithAuth('/api/v1/donors/grants?limit=200', 'Grants').then(d => d && setGrants(d)),
      fetchWithAuth('/api/v1/settings/fiscal-years?limit=50', 'Fiscal Years').then(d => d && setFiscalYears(d)),
      fetchWithAuth('/api/v1/finance/accounts?isGroup=false&limit=500', 'Accounts').then(d => d && setAccounts(d)),
    ]).finally(() => {
      setLoadErrors(errors)
      setLoadingData(false)
    })
  }, [])

  // Auto-fill dates when fiscal year is selected
  useEffect(() => {
    if (fiscalYearId) {
      const fy = fiscalYears.find(f => f.id === fiscalYearId)
      if (fy && !startDate && !endDate) {
        setStartDate(fy.startDate.split('T')[0])
        setEndDate(fy.endDate.split('T')[0])
      }
    }
  }, [fiscalYearId, fiscalYears, startDate, endDate])

  function updateLine(index: number, field: keyof BudgetLine, value: string) {
    setLines(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      // Auto-calculate totalAmount
      if (field === 'quantity' || field === 'unitCost' || field === 'levelOfEffort' || field === 'duration') {
        const qty = parseFloat(updated[index].quantity) || 1
        const cost = parseFloat(updated[index].unitCost) || 0
        const loe = parseFloat(updated[index].levelOfEffort) || 100
        const dur = parseFloat(updated[index].duration) || 1

        // For personnel: unitCost × quantity × (LoE/100) × duration
        // For others: unitCost × quantity
        let total: number
        if (updated[index].category === 'Personnel' && updated[index].levelOfEffort) {
          total = cost * qty * (loe / 100) * dur
        } else if (updated[index].duration && parseFloat(updated[index].duration) > 0) {
          total = cost * qty * dur
        } else {
          total = cost * qty
        }
        updated[index].totalAmount = String(Math.round(total * 100) / 100)
      }

      // Reset sub-category when category changes
      if (field === 'category') {
        updated[index].subCategory = ''
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

  // Calculations
  const lineTotal = useMemo(() =>
    lines.reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0),
    [lines]
  )

  const personnelTotal = useMemo(() =>
    lines
      .filter(l => l.category === 'Personnel')
      .reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0),
    [lines]
  )

  const icrRate = parseFloat(indirectCostRate) || 0
  const icrAmount = useMemo(() => {
    if (icrRate <= 0) return 0
    const base = indirectCostBase === 'PERSONNEL' ? personnelTotal : lineTotal
    return Math.round(base * (icrRate / 100) * 100) / 100
  }, [icrRate, indirectCostBase, lineTotal, personnelTotal])

  const totalProjectCost = lineTotal + icrAmount

  const costSharePct = parseFloat(costSharePercent) || 0
  const costShareAmt = costShareRequired && costSharePct > 0
    ? Math.round(totalProjectCost * (costSharePct / 100) * 100) / 100
    : 0
  const donorAmt = costShareRequired ? totalProjectCost - costShareAmt : totalProjectCost

  // Category summary
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {}
    for (const line of lines) {
      if (line.category) {
        summary[line.category] = (summary[line.category] || 0) + (parseFloat(line.totalAmount) || 0)
      }
    }
    return summary
  }, [lines])

  function validate(): boolean {
    if (!name.trim() || !fiscalYearId || (!projectId && !businessUnitId)) {
      setError(t('form.requiredFields'))
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
    if (budgetCeiling && totalProjectCost > parseFloat(budgetCeiling)) {
      setError(`Total (${formatCurrency(totalProjectCost)}) exceeds budget ceiling (${formatCurrency(parseFloat(budgetCeiling))})`)
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
      budgetType,
      projectId: projectId || undefined,
      businessUnitId: businessUnitId || undefined,
      departmentId: departmentId || undefined,
      costCenterId: costCenterId || undefined,
      fundClassId: fundClassId || undefined,
      grantId: grantId || undefined,
      fiscalYearId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      periodType,
      totalAmount: totalProjectCost,
      currencyCode,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
      indirectCostRate: icrRate > 0 ? icrRate : undefined,
      indirectCostBase: icrRate > 0 ? (indirectCostBase || 'TOTAL_DIRECT') : undefined,
      costShareRequired,
      costSharePercent: costShareRequired ? costSharePct : undefined,
      budgetCeiling: budgetCeiling ? parseFloat(budgetCeiling) : undefined,
      varianceThreshold: parseFloat(varianceThreshold) || 10,
      narrative: narrative.trim() || undefined,
      assumptions: assumptions.trim() || undefined,
      notes: notes.trim() || undefined,
      lines: lines.map(l => ({
        accountId: l.accountId,
        category: l.category,
        subCategory: l.subCategory || undefined,
        description: l.description.trim(),
        unit: l.unit || undefined,
        quantity: parseFloat(l.quantity) || 1,
        unitCost: parseFloat(l.unitCost) || 0,
        totalAmount: parseFloat(l.totalAmount),
        levelOfEffort: l.levelOfEffort ? parseFloat(l.levelOfEffort) : undefined,
        duration: l.duration ? parseInt(l.duration) : undefined,
        donorShare: l.donorShare ? parseFloat(l.donorShare) : undefined,
        costShare: l.costShare ? parseFloat(l.costShare) : undefined,
        narrative: l.narrative.trim() || undefined,
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

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loadErrors.length > 0 && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
          {loadErrors.join(', ')} {t('form.checkSeedData')}
        </div>
      )}

      {loadingData ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading...</span>
          </CardContent>
        </Card>
      ) : (
      <>

      {/* ──── Section 1: Budget Identification ──── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('form.budgetDetails')}
          </CardTitle>
          <CardDescription>{t('form.createDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Name + Budget Type */}
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
              <Label htmlFor="budget-type">{t('budgetType.label')}</Label>
              <SearchableSelect
                id="budget-type"
                options={BUDGET_TYPES.map((bt) => ({ value: bt.value, label: t(bt.label) }))}
                value={budgetType}
                onValueChange={setBudgetType}
              />
            </div>
          </div>

          {/* Row 2: Concern + Fund Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-business-unit">Concern / Business Unit *</Label>
              <SearchableSelect
                id="budget-business-unit"
                options={businessUnits.map((bu) => ({ value: bu.id, label: `${bu.code} - ${bu.shortName ?? bu.name}` }))}
                value={businessUnitId}
                onValueChange={(v) => {
                  setBusinessUnitId(v)
                  setCostCenterId('')
                }}
                placeholder="Select concern"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-fund-class">Fund Class</Label>
              <SearchableSelect
                id="budget-fund-class"
                options={fundClasses.map((fc) => ({ value: fc.id, label: `${fc.code} - ${fc.name}` }))}
                value={fundClassId}
                onValueChange={setFundClassId}
                placeholder="Select fund class"
              />
            </div>
          </div>

          {/* Row 3: Project + Grant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-project">{t('project')} <span className="text-muted-foreground text-xs">(optional for concern budget)</span></Label>
              <SearchableSelect
                id="budget-project"
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                value={projectId}
                onValueChange={setProjectId}
                placeholder={t('form.selectProject')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-grant">{t('grant')}</Label>
              <SearchableSelect
                id="budget-grant"
                options={grants.map((g) => ({ value: g.id, label: `${g.grantNo} - ${g.title}` }))}
                value={grantId}
                onValueChange={setGrantId}
                placeholder={t('form.selectGrant')}
              />
            </div>
          </div>

          {/* Row 2b: Department + Cost Center */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-department">Department</Label>
              <SearchableSelect
                id="budget-department"
                options={departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
                value={departmentId}
                onValueChange={setDepartmentId}
                placeholder="Select department (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-cost-center">Cost Center</Label>
              <SearchableSelect
                id="budget-cost-center"
                options={costCenters
                  .filter((cc) => !businessUnitId || cc.businessUnitId === businessUnitId)
                  .map((cc) => ({ value: cc.id, label: `${cc.code} - ${cc.name}` }))}
                value={costCenterId}
                onValueChange={setCostCenterId}
                placeholder="Select cost center (optional)"
              />
            </div>
          </div>

          {/* Row 3: Fiscal Year + Period Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-fiscal-year">{t('form.fiscalYear')} *</Label>
              <SearchableSelect
                id="budget-fiscal-year"
                options={fiscalYears.map((fy) => ({ value: fy.id, label: fy.name }))}
                value={fiscalYearId}
                onValueChange={setFiscalYearId}
                placeholder={t('form.selectFiscalYear')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-period-type">{t('periodType.label')}</Label>
              <SearchableSelect
                id="budget-period-type"
                options={PERIOD_TYPES.map((pt) => ({ value: pt.value, label: t(pt.label) }))}
                value={periodType}
                onValueChange={setPeriodType}
              />
            </div>
          </div>

          {/* Row 4: Start Date + End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-start-date">{t('form.startDate')}</Label>
              <Input
                id="budget-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-end-date">{t('form.endDate')}</Label>
              <Input
                id="budget-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 5: Currency + Exchange Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget-currency">{t('form.currency')}</Label>
              <SearchableSelect
                id="budget-currency"
                options={[
                  { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                ]}
                value={currencyCode}
                onValueChange={setCurrencyCode}
              />
            </div>

            {currencyCode !== 'BDT' && (
              <div className="space-y-2">
                <Label htmlFor="budget-exchange-rate">{t('form.exchangeRate')}</Label>
                <Input
                  id="budget-exchange-rate"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder={t('form.exchangeRatePlaceholder')}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="budget-notes">{t('form.notes')}</Label>
            <Textarea
              id="budget-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* ──── Section 2: ICR (Collapsible) ──── */}
      <Collapsible open={icrOpen} onOpenChange={setIcrOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">{t('indirectCost.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('indirectCost.description')}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {icrRate > 0 && (
                    <Badge variant="secondary">{icrRate}% = {formatCurrency(icrAmount)}</Badge>
                  )}
                  {icrOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('indirectCost.rate')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={indirectCostRate}
                    onChange={(e) => setIndirectCostRate(e.target.value)}
                    placeholder={t('indirectCost.ratePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('indirectCost.base')}</Label>
                  <SearchableSelect
                    id="budget-icr-base"
                    options={ICR_BASES.map((base) => ({ value: base.value, label: t(base.label) }))}
                    value={indirectCostBase}
                    onValueChange={setIndirectCostBase}
                    placeholder={t('indirectCost.basePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('indirectCost.amount')}</Label>
                  <Input
                    type="text"
                    value={formatCurrency(icrAmount)}
                    disabled
                    className="bg-muted font-mono"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  USAID: Negotiated Indirect Cost Rate Agreement (NICRA). EU: flat 7% of eligible direct costs.
                  ICR is calculated on the selected base and added to the total project cost.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ──── Section 3: Cost Sharing (Collapsible) ──── */}
      <Collapsible open={costShareOpen} onOpenChange={setCostShareOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">{t('costShare.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('costShare.description')}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {costShareRequired && (
                    <Badge variant="secondary">{costSharePct}% match</Badge>
                  )}
                  {costShareOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={costShareRequired}
                  onCheckedChange={setCostShareRequired}
                  id="cost-share-toggle"
                />
                <Label htmlFor="cost-share-toggle">{t('costShare.required')}</Label>
              </div>

              {costShareRequired && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('costShare.percent')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={costSharePercent}
                      onChange={(e) => setCostSharePercent(e.target.value)}
                      placeholder={t('costShare.percentPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('costShare.amount')}</Label>
                    <Input
                      type="text"
                      value={formatCurrency(costShareAmt)}
                      disabled
                      className="bg-muted font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('costShare.donorAmount')}</Label>
                    <Input
                      type="text"
                      value={formatCurrency(donorAmt)}
                      disabled
                      className="bg-muted font-mono"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ──── Section 4: Budget Controls (Collapsible) ──── */}
      <Collapsible open={controlsOpen} onOpenChange={setControlsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">{t('controls.title')}</CardTitle>
                  </div>
                </div>
                {controlsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('controls.ceiling')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetCeiling}
                    onChange={(e) => setBudgetCeiling(e.target.value)}
                    placeholder={t('controls.ceilingPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('controls.varianceThreshold')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={varianceThreshold}
                    onChange={(e) => setVarianceThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t('controls.varianceDescription')}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ──── Section 5: Budget Lines ──── */}
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
                  {line.category && (
                    <Badge variant="outline" className="ml-2">{line.category}</Badge>
                  )}
                </span>
                {lines.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              {/* Row 1: Account + Category + Sub-Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.account')} *</Label>
                  <SearchableSelect
                    id={`line-${index}-account`}
                    options={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                    value={line.accountId}
                    onValueChange={(v) => updateLine(index, 'accountId', v)}
                    placeholder={t('form.selectAccount')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.category')} *</Label>
                  <SearchableSelect
                    id={`line-${index}-category`}
                    options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                    value={line.category}
                    onValueChange={(v) => updateLine(index, 'category', v)}
                    placeholder={t('form.selectCategory')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('form.subCategory')}</Label>
                  <SearchableSelect
                    id={`line-${index}-subcategory`}
                    options={(SUB_CATEGORIES[line.category] || []).map((sub) => ({ value: sub, label: sub }))}
                    value={line.subCategory}
                    onValueChange={(v) => updateLine(index, 'subCategory', v)}
                    placeholder={t('form.selectSubCategory')}
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-2">
                <Label>{t('form.description')} *</Label>
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(index, 'description', e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              </div>

              {/* Row 3: Unit + Qty + Unit Cost + LoE + Duration + Total */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.unit')}</Label>
                  <SearchableSelect
                    id={`line-${index}-unit`}
                    options={[
                      { value: 'Month', label: 'Month' },
                      { value: 'Day', label: 'Day' },
                      { value: 'Person', label: 'Person' },
                      { value: 'Trip', label: 'Trip' },
                      { value: 'Unit', label: 'Unit' },
                      { value: 'Lot', label: 'Lot' },
                      { value: 'Lump Sum', label: 'Lump Sum' },
                    ]}
                    value={line.unit}
                    onValueChange={(v) => updateLine(index, 'unit', v)}
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

                {line.category === 'Personnel' && (
                  <div className="space-y-2">
                    <Label>{t('form.levelOfEffort')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={line.levelOfEffort}
                      onChange={(e) => updateLine(index, 'levelOfEffort', e.target.value)}
                      placeholder={t('form.levelOfEffortPlaceholder')}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('form.duration')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.duration}
                    onChange={(e) => updateLine(index, 'duration', e.target.value)}
                    placeholder={t('form.durationPlaceholder')}
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

              {/* Row 4: Cost share (if enabled) + Narrative (collapsible) */}
              {(costShareRequired || line.narrative) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {costShareRequired && (
                    <>
                      <div className="space-y-2">
                        <Label>{t('form.donorShare')}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.donorShare}
                          onChange={(e) => updateLine(index, 'donorShare', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('form.costShareLine')}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.costShare}
                          onChange={(e) => updateLine(index, 'costShare', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Line Narrative */}
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
            </div>
          ))}

          {/* Category Summary */}
          {Object.keys(categorySummary).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Category Breakdown</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(categorySummary).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center bg-muted/50 rounded-md px-3 py-2">
                      <span className="text-sm">{cat}</span>
                      <span className="text-sm font-mono font-medium">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Line total summary */}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('form.lineSum')}</span>
            <span className="text-lg font-bold font-mono">{formatCurrency(lineTotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ──── Section 6: Budget Narratives (Collapsible) ──── */}
      <Collapsible open={narrativesOpen} onOpenChange={setNarrativesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-base">{t('narratives.title')}</CardTitle>
                    <CardDescription className="text-xs">{t('narratives.description')}</CardDescription>
                  </div>
                </div>
                {narrativesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('narratives.narrative')}</Label>
                <Textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder={t('narratives.narrativePlaceholder')}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('narratives.assumptions')}</Label>
                <Textarea
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder={t('narratives.assumptionsPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ──── Section 7: Budget Summary ──── */}
      <Card>
        <CardHeader>
          <CardTitle>{t('summary.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SummaryRow label={t('summary.directCosts')} value={lineTotal} formatCurrency={formatCurrency} />
            {icrAmount > 0 && (
              <SummaryRow
                label={`${t('summary.indirectCosts')} (${icrRate}%)`}
                value={icrAmount}
                formatCurrency={formatCurrency}
              />
            )}
            <Separator />
            <SummaryRow
              label={t('summary.totalProjectCost')}
              value={totalProjectCost}
              formatCurrency={formatCurrency}
              bold
            />
            {costShareRequired && costShareAmt > 0 && (
              <>
                <SummaryRow
                  label={t('summary.donorContribution')}
                  value={donorAmt}
                  formatCurrency={formatCurrency}
                />
                <SummaryRow
                  label={`${t('summary.costShareMatch')} (${costSharePct}%)`}
                  value={costShareAmt}
                  formatCurrency={formatCurrency}
                />
                <Separator />
                <SummaryRow
                  label={t('summary.totalFunding')}
                  value={totalProjectCost}
                  formatCurrency={formatCurrency}
                  bold
                />
              </>
            )}
          </div>
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
      </>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  formatCurrency: fmt,
  bold,
}: {
  label: string
  value: number
  formatCurrency: (v: number) => string
  bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold text-base' : 'text-sm'}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span className="font-mono">{fmt(value)}</span>
    </div>
  )
}
