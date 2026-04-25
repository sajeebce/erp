'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ChevronDown, ChevronUp, SlidersHorizontal,
  FileSpreadsheet, BarChart3, PieChart, TrendingUp, Wallet, Receipt,
  BookOpen, Calendar, Landmark, FileText, Shield, DollarSign,
  ClipboardList, Clock, Coins, Utensils, FileCheck, Calculator, Globe,
  ChevronsUpDown, Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { HelpButton } from '@/components/shared/help-modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

// ─── API Types ────────────────────────────────────────────────────────────────

interface Sector       { id: string; name: string }
interface BusinessUnit { id: string; name: string; shortName: string | null; sectorId: string }
interface CostCenter   { id: string; name: string; businessUnitId: string }
interface FundClass    { id: string; name: string }
interface Project      { id: string; name: string; projectNo?: string }
interface Grant        { id: string; title: string; grantNo?: string }

// ─── Searchable Combobox ──────────────────────────────────────────────────────

interface ComboOption { value: string; label: string; sublabel?: string }

function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  className,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: ComboOption[]
  placeholder: string
  allLabel: string
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find(o => o.value === value)
  const displayLabel = value === 'all' ? allLabel : (selected?.label ?? allLabel)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setSearch('') }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-8 text-xs justify-between gap-1 font-normal', className)}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder}...`}
            value={search}
            onValueChange={setSearch}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">No results</CommandEmpty>
            <CommandGroup>
              {/* All option */}
              <CommandItem
                value="all"
                onSelect={() => { onChange('all'); setOpen(false); setSearch('') }}
                className="text-xs"
              >
                <Check className={cn('mr-2 h-3.5 w-3.5', value === 'all' ? 'opacity-100' : 'opacity-0')} />
                {allLabel}
              </CommandItem>
              {filtered.map(o => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  onSelect={() => { onChange(o.value); setOpen(false); setSearch('') }}
                  className="text-xs"
                >
                  <Check className={cn('mr-2 h-3.5 w-3.5', value === o.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.sublabel && <span className="ml-2 text-[10px] text-muted-foreground">{o.sublabel}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Report Types ─────────────────────────────────────────────────────────────

interface ReportDef { type: string; icon: React.ElementType; category: 'core' | 'subsidiary' | 'ngo' | 'expense' }

const REPORTS: ReportDef[] = [
  { type: 'trial-balance',                  icon: FileSpreadsheet, category: 'core' },
  { type: 'income-statement',               icon: BarChart3,       category: 'core' },
  { type: 'balance-sheet',                  icon: PieChart,        category: 'core' },
  { type: 'cash-flow',                      icon: TrendingUp,      category: 'core' },
  { type: 'receipts-payments',              icon: Receipt,         category: 'core' },
  { type: 'ledger',                         icon: BookOpen,        category: 'subsidiary' },
  { type: 'day-book',                       icon: Calendar,        category: 'subsidiary' },
  { type: 'bank-book',                      icon: Landmark,        category: 'subsidiary' },
  { type: 'cash-book',                      icon: FileText,        category: 'subsidiary' },
  { type: 'fund-position',                  icon: Wallet,          category: 'ngo' },
  { type: 'fund-balance-changes',           icon: DollarSign,      category: 'ngo' },
  { type: 'grant-financial',                icon: Shield,          category: 'ngo' },
  { type: 'bank-reconciliation-statement',  icon: Landmark,        category: 'ngo' },
  { type: 'expense-summary',               icon: ClipboardList,   category: 'expense' },
  { type: 'advance-aging',                 icon: Clock,           category: 'expense' },
  { type: 'petty-cash-statement',          icon: Coins,           category: 'expense' },
  { type: 'per-diem-utilization',          icon: Utensils,        category: 'expense' },
  { type: 'receipt-compliance',            icon: FileCheck,       category: 'expense' },
  { type: 'tds-vds-register',              icon: Calculator,      category: 'expense' },
  { type: 'donor-expense-report',          icon: Globe,           category: 'expense' },
]

const CATEGORY_COLORS: Record<string, string> = {
  core:       'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  subsidiary: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  ngo:        'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
  expense:    'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core', subsidiary: 'Subsidiary', ngo: 'NGO', expense: 'Expense',
}

// ─── Dimension state / filter types ──────────────────────────────────────────

interface DimFilters {
  sectorId: string
  businessUnitId: string
  costCenterId: string
  fundClassId: string
  projectId: string
  grantId: string
}

interface DimData {
  sectors: Sector[]
  businessUnits: BusinessUnit[]
  costCenters: CostCenter[]
  fundClasses: FundClass[]
  projects: Project[]
  grants: Grant[]
}

// ─── Dimension Filter Bar ─────────────────────────────────────────────────────

function DimensionFilterBar({
  filters,
  onChange,
  data,
  loading,
}: {
  filters: DimFilters
  onChange: (key: keyof DimFilters, value: string) => void
  data: DimData
  loading: boolean
}) {
  const filteredBUs: BusinessUnit[] = filters.sectorId !== 'all'
    ? data.businessUnits.filter(bu => bu.sectorId === filters.sectorId)
    : data.businessUnits

  const filteredCCs: CostCenter[] = filters.businessUnitId !== 'all'
    ? data.costCenters.filter(cc => cc.businessUnitId === filters.businessUnitId)
    : data.costCenters

  const sectorOptions: ComboOption[] = data.sectors.map(s => ({ value: s.id, label: s.name }))

  const buOptions: ComboOption[] = filteredBUs.map(b => ({
    value: b.id,
    label: b.shortName ?? b.name,
    sublabel: b.shortName ? b.name : undefined,
  }))

  const ccOptions: ComboOption[] = filteredCCs.map(c => ({ value: c.id, label: c.name }))

  const fcOptions: ComboOption[] = data.fundClasses.map(f => ({ value: f.id, label: f.name }))

  const projectOptions: ComboOption[] = data.projects.map(p => ({
    value: p.id,
    label: p.name,
    sublabel: p.projectNo,
  }))

  const grantOptions: ComboOption[] = data.grants.map(g => ({
    value: g.id,
    label: g.title,
    sublabel: g.grantNo,
  }))

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 rounded-lg border bg-muted/30">
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Dimension Filters
      </span>

      <SearchableCombobox
        value={filters.sectorId}
        onChange={v => { onChange('sectorId', v); onChange('businessUnitId', 'all'); onChange('costCenterId', 'all') }}
        options={sectorOptions}
        placeholder="sector"
        allLabel="All Sectors"
        className="w-40"
        disabled={loading}
      />

      <SearchableCombobox
        value={filters.businessUnitId}
        onChange={v => { onChange('businessUnitId', v); onChange('costCenterId', 'all') }}
        options={buOptions}
        placeholder="business unit"
        allLabel="All Business Units"
        className="w-44"
        disabled={loading}
      />

      <SearchableCombobox
        value={filters.costCenterId}
        onChange={v => onChange('costCenterId', v)}
        options={ccOptions}
        placeholder="cost center"
        allLabel="All Cost Centers"
        className="w-40"
        disabled={loading || filters.businessUnitId === 'all'}
      />

      <SearchableCombobox
        value={filters.fundClassId}
        onChange={v => onChange('fundClassId', v)}
        options={fcOptions}
        placeholder="fund class"
        allLabel="All Fund Classes"
        className="w-44"
        disabled={loading}
      />

      <SearchableCombobox
        value={filters.projectId}
        onChange={v => onChange('projectId', v)}
        options={projectOptions}
        placeholder="project"
        allLabel="All Projects"
        className="w-40"
        disabled={loading}
      />

      <SearchableCombobox
        value={filters.grantId}
        onChange={v => onChange('grantId', v)}
        options={grantOptions}
        placeholder="grant"
        allLabel="All Grants"
        className="w-44"
        disabled={loading}
      />
    </div>
  )
}

// ─── Active Filter Pills ──────────────────────────────────────────────────────

function ActiveFilterPills({ filters, data }: { filters: DimFilters; data: DimData }) {
  const pills: string[] = []
  if (filters.sectorId !== 'all')       pills.push(data.sectors.find(s => s.id === filters.sectorId)?.name ?? '')
  if (filters.businessUnitId !== 'all') pills.push(data.businessUnits.find(b => b.id === filters.businessUnitId)?.shortName ?? data.businessUnits.find(b => b.id === filters.businessUnitId)?.name ?? '')
  if (filters.costCenterId !== 'all')   pills.push(data.costCenters.find(c => c.id === filters.costCenterId)?.name ?? '')
  if (filters.fundClassId !== 'all')    pills.push(data.fundClasses.find(f => f.id === filters.fundClassId)?.name ?? '')
  if (filters.projectId !== 'all')      pills.push(data.projects.find(p => p.id === filters.projectId)?.name ?? '')
  if (filters.grantId !== 'all')        pills.push(data.grants.find(g => g.id === filters.grantId)?.title ?? '')
  const clean = pills.filter(Boolean)
  if (clean.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {clean.map(p => (
        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
      ))}
    </div>
  )
}

// ─── Report Section ───────────────────────────────────────────────────────────

function ReportSection({
  title, category, reports, t, onOpen,
}: {
  title: string; category: string; reports: ReportDef[]
  t: (key: string) => string; onOpen: (type: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => {
          const Icon = report.icon
          return (
            <Card key={report.type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(report.type)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[category]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t(`types.${report.type}.title`)}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">{CATEGORY_LABELS[category]}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t(`types.${report.type}.desc`)}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_DIM: DimData = {
  sectors: [], businessUnits: [], costCenters: [], fundClasses: [], projects: [], grants: [],
}

export default function FinancialReportsPage() {
  const t = useTranslations('finance.financialReports')
  const router = useRouter()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<DimFilters>({
    sectorId: 'all', businessUnitId: 'all', costCenterId: 'all',
    fundClassId: 'all', projectId: 'all', grantId: 'all',
  })
  const [dimData, setDimData] = useState<DimData>(EMPTY_DIM)
  const [loading, setLoading] = useState(false)

  // Load dimension data once when the filter panel is opened
  const loadDimData = useCallback(async () => {
    if (dimData.sectors.length > 0) return // already loaded
    setLoading(true)
    try {
      const [secRes, buRes, ccRes, fcRes, prjRes, grRes] = await Promise.all([
        fetch('/api/v1/settings/sectors?isActive=true'),
        fetch('/api/v1/settings/business-units?isActive=true'),
        fetch('/api/v1/settings/cost-centers?isActive=true'),
        fetch('/api/v1/settings/fund-classes?isActive=true'),
        fetch('/api/v1/projects?limit=200'),
        fetch('/api/v1/donors/grants?limit=200'),
      ])
      const [sec, bu, cc, fc, prj, gr] = await Promise.all([
        secRes.json(), buRes.json(), ccRes.json(), fcRes.json(), prjRes.json(), grRes.json(),
      ])
      setDimData({
        sectors:      sec.success  ? sec.data  : [],
        businessUnits: bu.success  ? bu.data   : [],
        costCenters:  cc.success   ? cc.data   : [],
        fundClasses:  fc.success   ? fc.data   : [],
        projects:     prj.success  ? prj.data  : [],
        grants:       gr.success   ? gr.data   : [],
      })
    } catch (e) {
      console.error('Failed to load dimension data', e)
    } finally {
      setLoading(false)
    }
  }, [dimData.sectors.length])

  useEffect(() => {
    if (filtersOpen) loadDimData()
  }, [filtersOpen, loadDimData])

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all')

  function handleFilterChange(key: keyof DimFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function openReport(type: string) {
    const params = new URLSearchParams()
    if (filters.sectorId !== 'all')       params.set('sectorId', filters.sectorId)
    if (filters.businessUnitId !== 'all') params.set('businessUnitId', filters.businessUnitId)
    if (filters.costCenterId !== 'all')   params.set('costCenterId', filters.costCenterId)
    if (filters.fundClassId !== 'all')    params.set('fundClassId', filters.fundClassId)
    if (filters.projectId !== 'all')      params.set('projectId', filters.projectId)
    if (filters.grantId !== 'all')        params.set('grantId', filters.grantId)
    const qs = params.toString()
    router.push(`/finance/financial-reports/${type}${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={t('title')}
          description={t('description')}
          steps={[
            { title: t('helpStep1Title'), description: t('helpStep1Desc') },
            { title: t('helpStep2Title'), description: t('helpStep2Desc') },
            { title: t('helpStep3Title'), description: t('helpStep3Desc') },
          ]}
          tips={[t('helpTip1'), t('helpTip2'), t('helpTip3')]}
        />
        <Button
          variant={hasActiveFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltersOpen(v => !v)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Dimension Filters
          {hasActiveFilters && (
            <Badge className="ml-1.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
              {Object.values(filters).filter(v => v !== 'all').length}
            </Badge>
          )}
          {filtersOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-1.5" />}
        </Button>
      </PageHeader>

      {filtersOpen && (
        <div className="space-y-2">
          <DimensionFilterBar
            filters={filters}
            onChange={handleFilterChange}
            data={dimData}
            loading={loading}
          />
          <div className="flex items-center justify-between">
            <ActiveFilterPills filters={filters} data={dimData} />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={() => setFilters({
                  sectorId: 'all', businessUnitId: 'all', costCenterId: 'all',
                  fundClassId: 'all', projectId: 'all', grantId: 'all',
                })}
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      )}

      <ReportSection title={t('coreStatements')}    category="core"       reports={REPORTS.filter(r => r.category === 'core')}       t={t} onOpen={openReport} />
      <ReportSection title={t('subsidiaryBooks')}   category="subsidiary" reports={REPORTS.filter(r => r.category === 'subsidiary')} t={t} onOpen={openReport} />
      <ReportSection title={t('ngoReports')}        category="ngo"        reports={REPORTS.filter(r => r.category === 'ngo')}        t={t} onOpen={openReport} />
      <ReportSection title={t('expenseCompliance')} category="expense"    reports={REPORTS.filter(r => r.category === 'expense')}    t={t} onOpen={openReport} />
    </div>
  )
}
