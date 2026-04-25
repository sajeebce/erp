'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Mock Reference Data ─────────────────────────────────────────────────────

const BUSINESS_UNITS = [
  { id: 'bu1', code: 'BU-001', name: 'Reverend Abdul Wadud Memorial Hospital', shortName: 'CSS Hospital' },
  { id: 'bu2', code: 'BU-002', name: 'CSS Nursing Institute',                   shortName: 'CNI' },
  { id: 'bu3', code: 'BU-003', name: 'Hope Technical Institute',                shortName: 'HTI' },
  { id: 'bu4', code: 'BU-004', name: 'Hope Polytechnic Institute',              shortName: 'HPI' },
  { id: 'bu5', code: 'BU-005', name: 'Micro Finance Program',                   shortName: 'MFP' },
  { id: 'bu6', code: 'BU-006', name: 'CSS AVA Center',                          shortName: 'AVA' },
  { id: 'bu7', code: 'BU-007', name: 'CSS Press',                               shortName: 'CSS Press' },
]

const COST_CENTERS = [
  { id: 'cc1',  code: 'CC-OPD', name: 'OPD',                   buId: 'bu1' },
  { id: 'cc2',  code: 'CC-IPD', name: 'IPD',                   buId: 'bu1' },
  { id: 'cc3',  code: 'CC-PHR', name: 'Pharmacy',              buId: 'bu1' },
  { id: 'cc4',  code: 'CC-LAB', name: 'Laboratory',            buId: 'bu1' },
  { id: 'cc5',  code: 'CC-ADM', name: 'Administration',        buId: 'bu1' },
  { id: 'cc6',  code: 'CC-ACC', name: 'Accounts',              buId: 'bu1' },
  { id: 'cc7',  code: 'CC-TRN', name: 'Training',              buId: 'bu2' },
  { id: 'cc8',  code: 'CC-FOP', name: 'Field Operations',      buId: 'bu5' },
  { id: 'cc10', code: 'CC-VEH', name: 'Vehicle Cost',          buId: 'bu1' },
  { id: 'cc11', code: 'CC-UTL', name: 'Utilities & Maintenance', buId: 'bu1' },
  { id: 'cc12', code: 'CC-SWL', name: 'Social Welfare',        buId: 'bu6' },
]

const FUND_CLASSES = [
  { id: 'fc1', name: 'Unrestricted',           type: 'UNRESTRICTED' },
  { id: 'fc2', name: 'Restricted',             type: 'RESTRICTED' },
  { id: 'fc3', name: 'Temporarily Restricted', type: 'TEMPORARILY_RESTRICTED' },
  { id: 'fc4', name: 'Endowment',              type: 'ENDOWMENT' },
]

const PROJECTS_MOCK = [
  { id: 'p1', projectNo: 'PRJ-001', name: 'HIV/AIDS Prevention Program' },
  { id: 'p2', projectNo: 'PRJ-002', name: 'Maternal Health Initiative' },
  { id: 'p3', projectNo: 'PRJ-003', name: 'Vocational Training for Youth' },
  { id: 'p4', projectNo: 'PRJ-004', name: 'Micro-Enterprise Development' },
]

const GRANTS_MOCK = [
  { id: 'g1', name: 'USAID Health Program Grant' },
  { id: 'g2', name: 'World Bank Education Fund' },
  { id: 'g3', name: 'DFID Livelihoods Grant' },
  { id: 'g4', name: 'Global Fund – HIV Response' },
]

const EMPLOYEES_MOCK = [
  { id: 'e1', employeeNo: 'EMP-001', fullName: 'Dr. Md. Aminul Islam',   department: 'OPD' },
  { id: 'e2', employeeNo: 'EMP-002', fullName: 'Fatema Begum',           department: 'Nursing' },
  { id: 'e3', employeeNo: 'EMP-003', fullName: 'Md. Rafiqul Hasan',      department: 'Accounts' },
  { id: 'e4', employeeNo: 'EMP-004', fullName: 'Nasrin Akhter',          department: 'Field Operations' },
  { id: 'e5', employeeNo: 'EMP-005', fullName: 'Md. Shahabuddin Ahmed',  department: 'Administration' },
  { id: 'e6', employeeNo: 'EMP-006', fullName: 'Shapna Khatun',          department: 'Pharmacy' },
]

// ─── Demo Allocation Rows ─────────────────────────────────────────────────────

interface AllocationLine {
  businessUnit: string
  costCenter: string
  project?: string
  grant?: string
  fundClass: string
  percentage: number
}

interface DemoEmployeeRow {
  employee: { id: string; employeeNo: string; fullName: string; department: string }
  allocations: AllocationLine[]
  totalPct: number
  status: 'FULL' | 'PARTIAL' | 'UNALLOCATED' | 'OVER'
}

const DEMO_ROWS: DemoEmployeeRow[] = [
  {
    employee: EMPLOYEES_MOCK[0],
    totalPct: 100,
    status: 'FULL',
    allocations: [
      { businessUnit: 'CSS Hospital', costCenter: 'OPD', project: 'HIV/AIDS Prevention Program', grant: 'Global Fund – HIV Response', fundClass: 'Restricted', percentage: 100 },
    ],
  },
  {
    employee: EMPLOYEES_MOCK[1],
    totalPct: 100,
    status: 'FULL',
    allocations: [
      { businessUnit: 'CSS Hospital', costCenter: 'IPD', fundClass: 'Unrestricted', percentage: 60 },
      { businessUnit: 'CSS Nursing Institute', costCenter: 'Training', project: 'Maternal Health Initiative', fundClass: 'Restricted', percentage: 40 },
    ],
  },
  {
    employee: EMPLOYEES_MOCK[2],
    totalPct: 100,
    status: 'FULL',
    allocations: [
      { businessUnit: 'CSS Hospital', costCenter: 'Accounts', fundClass: 'Unrestricted', percentage: 100 },
    ],
  },
  {
    employee: EMPLOYEES_MOCK[3],
    totalPct: 75,
    status: 'PARTIAL',
    allocations: [
      { businessUnit: 'Micro Finance Program', costCenter: 'Field Operations', project: 'Micro-Enterprise Development', grant: 'DFID Livelihoods Grant', fundClass: 'Restricted', percentage: 75 },
    ],
  },
  {
    employee: EMPLOYEES_MOCK[4],
    totalPct: 0,
    status: 'UNALLOCATED',
    allocations: [],
  },
  {
    employee: EMPLOYEES_MOCK[5],
    totalPct: 110,
    status: 'OVER',
    allocations: [
      { businessUnit: 'CSS Hospital', costCenter: 'Pharmacy', fundClass: 'Unrestricted', percentage: 70 },
      { businessUnit: 'CSS Hospital', costCenter: 'Administration', fundClass: 'Unrestricted', percentage: 40 },
    ],
  },
]

// ─── Summary Counts ──────────────────────────────────────────────────────────

function computeSummary(rows: DemoEmployeeRow[]) {
  return {
    fullyAllocated: rows.filter(r => r.status === 'FULL').length,
    partiallyAllocated: rows.filter(r => r.status === 'PARTIAL').length,
    unallocated: rows.filter(r => r.status === 'UNALLOCATED').length,
    overAllocated: rows.filter(r => r.status === 'OVER').length,
  }
}

// ─── Percentage Badge ─────────────────────────────────────────────────────────

function PctBadge({ pct, status }: { pct: number; status: DemoEmployeeRow['status'] }) {
  if (status === 'OVER') {
    return (
      <Badge variant="destructive" className="font-mono text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />{pct}%
      </Badge>
    )
  }
  if (status === 'FULL') {
    return <Badge className="font-mono text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 dark:bg-emerald-950 dark:text-emerald-400">{pct}%</Badge>
  }
  if (status === 'PARTIAL') {
    return <Badge variant="outline" className="font-mono text-xs text-amber-600 border-amber-300">{pct}%</Badge>
  }
  return <Badge variant="secondary" className="font-mono text-xs text-muted-foreground">—</Badge>
}

// ─── Add Allocation Dialog ────────────────────────────────────────────────────

function AddAllocationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const t = useTranslations('hr.costAllocations')
  const tc = useTranslations('common')

  const [employeeId, setEmployeeId] = useState('')
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [fundClassId, setFundClassId] = useState('')
  const [percentage, setPercentage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredCostCenters = useMemo(
    () => (businessUnitId ? COST_CENTERS.filter(cc => cc.buId === businessUnitId) : COST_CENTERS),
    [businessUnitId],
  )

  function reset() {
    setEmployeeId('')
    setBusinessUnitId('')
    setCostCenterId('')
    setProjectId('')
    setGrantId('')
    setFundClassId('')
    setPercentage('')
    setStartDate('')
    setEndDate('')
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  function handleSave() {
    if (!employeeId || !businessUnitId || !costCenterId || !fundClassId || !percentage || !startDate) return
    setSaving(true)
    // UI-only: simulate save then close
    setTimeout(() => {
      setSaving(false)
      handleClose()
    }, 600)
  }

  const canSave = !!employeeId && !!businessUnitId && !!costCenterId && !!fundClassId && !!percentage && !!startDate

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else onOpenChange(true) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-employee">{t('form.employee')}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="ca-employee">
                <SelectValue placeholder={t('form.selectEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES_MOCK.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} <span className="text-muted-foreground ml-1">({emp.employeeNo})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Business Unit */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-bu">{t('form.businessUnit')}</Label>
            <Select value={businessUnitId} onValueChange={v => { setBusinessUnitId(v); setCostCenterId('') }}>
              <SelectTrigger id="ca-bu">
                <SelectValue placeholder={t('form.selectBusinessUnit')} />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_UNITS.map(bu => (
                  <SelectItem key={bu.id} value={bu.id}>{bu.shortName} — {bu.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Center */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-cc">{t('form.costCenter')}</Label>
            <Select value={costCenterId} onValueChange={setCostCenterId} disabled={!businessUnitId}>
              <SelectTrigger id="ca-cc">
                <SelectValue placeholder={t('form.selectCostCenter')} />
              </SelectTrigger>
              <SelectContent>
                {filteredCostCenters.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.code} — {cc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Project (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="ca-project">{t('form.project')}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="ca-project">
                  <SelectValue placeholder={t('form.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  {PROJECTS_MOCK.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNo}: {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grant (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="ca-grant">{t('form.grant')}</Label>
              <Select value={grantId} onValueChange={setGrantId}>
                <SelectTrigger id="ca-grant">
                  <SelectValue placeholder={t('form.selectGrant')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  {GRANTS_MOCK.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fund Class */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-fundclass">{t('form.fundClass')}</Label>
            <Select value={fundClassId} onValueChange={setFundClassId}>
              <SelectTrigger id="ca-fundclass">
                <SelectValue placeholder={t('form.selectFundClass')} />
              </SelectTrigger>
              <SelectContent>
                {FUND_CLASSES.map(fc => (
                  <SelectItem key={fc.id} value={fc.id}>{fc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Percentage */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-pct">{t('form.percentage')}</Label>
            <Input
              id="ca-pct"
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
              placeholder={t('form.percentagePlaceholder')}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ca-start">{t('form.startDate')}</Label>
              <Input
                id="ca-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-end">{t('form.endDate')}</Label>
              <Input
                id="ca-end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{tc('buttons.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? t('form.saving') : t('form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CostAllocationsPage() {
  const t = useTranslations('hr.costAllocations')

  const [buFilter, setBuFilter] = useState('all')
  const [ccFilter, setCcFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [grantFilter, setGrantFilter] = useState('all')
  const [fundClassFilter, setFundClassFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const rows = useMemo(() => {
    let result = DEMO_ROWS
    if (buFilter !== 'all') {
      const buName = BUSINESS_UNITS.find(b => b.id === buFilter)?.shortName ?? ''
      result = result.filter(r =>
        r.allocations.some(a => a.businessUnit.toLowerCase().includes(buName.toLowerCase()))
      )
    }
    if (ccFilter !== 'all') {
      const ccName = COST_CENTERS.find(c => c.id === ccFilter)?.name ?? ''
      result = result.filter(r =>
        r.allocations.some(a => a.costCenter === ccName)
      )
    }
    if (projectFilter !== 'all') {
      const pName = PROJECTS_MOCK.find(p => p.id === projectFilter)?.name ?? ''
      result = result.filter(r =>
        r.allocations.some(a => a.project === pName)
      )
    }
    if (grantFilter !== 'all') {
      const gName = GRANTS_MOCK.find(g => g.id === grantFilter)?.name ?? ''
      result = result.filter(r =>
        r.allocations.some(a => a.grant === gName)
      )
    }
    if (fundClassFilter !== 'all') {
      const fcName = FUND_CLASSES.find(f => f.id === fundClassFilter)?.name ?? ''
      result = result.filter(r =>
        r.allocations.some(a => a.fundClass === fcName)
      )
    }
    return result
  }, [buFilter, ccFilter, projectFilter, grantFilter, fundClassFilter])

  const summary = computeSummary(rows)

  function clearFilters() {
    setBuFilter('all')
    setCcFilter('all')
    setProjectFilter('all')
    setGrantFilter('all')
    setFundClassFilter('all')
  }

  const hasFilters = buFilter !== 'all' || ccFilter !== 'all' || projectFilter !== 'all' || grantFilter !== 'all' || fundClassFilter !== 'all'

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('addAllocation')}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={buFilter} onValueChange={setBuFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('filters.businessUnit')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allUnits')}</SelectItem>
            {BUSINESS_UNITS.map(bu => (
              <SelectItem key={bu.id} value={bu.id}>{bu.shortName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ccFilter} onValueChange={setCcFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.costCenter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCostCenters')}</SelectItem>
            {COST_CENTERS.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.project')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allProjects')}</SelectItem>
            {PROJECTS_MOCK.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={grantFilter} onValueChange={setGrantFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.grant')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allGrants')}</SelectItem>
            {GRANTS_MOCK.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fundClassFilter} onValueChange={setFundClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filters.fundClass')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allFundClasses')}</SelectItem>
            {FUND_CLASSES.map(fc => (
              <SelectItem key={fc.id} value={fc.id}>{fc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('fullyAllocated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{summary.fullyAllocated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('partiallyAllocated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{summary.partiallyAllocated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('unallocated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{summary.unallocated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('overAllocated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{summary.overAllocated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Table */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noAllocations')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('matrix')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">{t('employee')}</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[140px]">{t('concern')}</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">{t('costCenter')}</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[140px]">{t('fundClass')}</TableHead>
                  <TableHead className="text-center w-[110px]">{t('totalAllocation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const isOver = row.status === 'OVER'
                  return (
                    <TableRow key={row.employee.id} className={isOver ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{row.employee.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{row.employee.employeeNo}</p>
                          <p className="text-xs text-muted-foreground">{row.employee.department}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {row.allocations.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="space-y-1">
                            {row.allocations.map((a, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                {a.businessUnit}
                                {a.percentage < 100 && (
                                  <Badge variant="outline" className="ml-1.5 text-[10px] py-0">{a.percentage}%</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {row.allocations.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="space-y-1">
                            {row.allocations.map((a, i) => (
                              <div key={i} className="text-xs text-muted-foreground">{a.costCenter}</div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {row.allocations.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="space-y-1">
                            {row.allocations.map((a, i) => (
                              <div key={i} className="text-xs text-muted-foreground">{a.fundClass}</div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <PctBadge pct={row.totalPct} status={row.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddAllocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
