'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface ProjectInfo {
  id: string
  projectNo: string
  name: string
}

interface EmployeeRow {
  employee: {
    id: string
    employeeNo: string
    fullName: string
    department: string | null
  }
  allocations: Record<string, number>
  totalPct: number
  unallocatedPct: number
}

interface MatrixData {
  projects: ProjectInfo[]
  employees: EmployeeRow[]
  summary: {
    totalEmployees: number
    totalProjects: number
    fullyAllocated: number
    partiallyAllocated: number
    unallocated: number
  }
}

interface Department {
  id: string
  name: string
}

interface EmployeeOption {
  id: string
  employeeNo: string
  fullName: string
}

export default function ProjectAllocationsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [matrixData, setMatrixData] = useState<MatrixData | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([])
  const [allProjects, setAllProjects] = useState<ProjectInfo[]>([])

  // Form state
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formPercentage, setFormPercentage] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  const fetchMatrix = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (departmentFilter && departmentFilter !== 'all') {
      params.set('departmentId', departmentFilter)
    }
    fetch(`/api/v1/hr/project-allocations?${params}`)
      .then(r => r.json())
      .then(json => { if (json.success) setMatrixData(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [departmentFilter])

  useEffect(() => { fetchMatrix() }, [fetchMatrix])

  useEffect(() => {
    fetch('/api/v1/hr/departments?limit=200')
      .then(r => r.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(console.error)
  }, [])

  function openAddDialog() {
    setFormEmployeeId('')
    setFormProjectId('')
    setFormPercentage('')
    setFormStartDate('')
    setFormEndDate('')
    setDialogOpen(true)

    // Fetch employees and projects for selects
    Promise.all([
      fetch('/api/v1/hr/employees?limit=500&status=ACTIVE').then(r => r.json()),
      fetch('/api/v1/projects?limit=500').then(r => r.json()),
    ])
      .then(([empRes, projRes]) => {
        if (empRes.success) setAllEmployees(empRes.data)
        if (projRes.success) setAllProjects(projRes.data)
      })
      .catch(console.error)
  }

  async function handleSave() {
    if (!formEmployeeId || !formProjectId || !formPercentage || !formStartDate) return
    setSaving(true)

    const payload = {
      employeeId: formEmployeeId,
      projectId: formProjectId,
      percentage: Number(formPercentage),
      startDate: formStartDate,
      endDate: formEndDate || null,
    }

    try {
      const res = await fetch('/api/v1/hr/project-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setDialogOpen(false)
        fetchMatrix()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const projects = matrixData?.projects ?? []
  const employees = matrixData?.employees ?? []
  const summary = matrixData?.summary

  return (
    <div className="space-y-6">
      <PageHeader title={t('projectAllocations.title')} description={t('projectAllocations.description')}>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />{t('projectAllocations.addAllocation')}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('fields.department')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalEmployees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fully Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{summary.fullyAllocated}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Partially Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{summary.partiallyAllocated}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('projectAllocations.unallocated')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">{summary.unallocated}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matrix Table */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {tc('labels.loading')}
          </CardContent>
        </Card>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('projectAllocations.noAllocations')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('projectAllocations.matrix')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                      {t('fields.fullName')}
                    </TableHead>
                    <TableHead className="sticky left-[200px] bg-background z-10 min-w-[120px]">
                      {t('fields.department')}
                    </TableHead>
                    {projects.map(project => (
                      <TableHead key={project.id} className="text-center min-w-[100px]">
                        <div className="text-xs">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-muted-foreground">{project.projectNo}</p>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[100px] font-bold">
                      {t('projectAllocations.totalAllocation')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(row => {
                    const isOverAllocated = row.totalPct > 100
                    return (
                      <TableRow
                        key={row.employee.id}
                        className={isOverAllocated ? 'bg-destructive/10' : ''}
                      >
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          <div>
                            <p className="text-sm">{row.employee.fullName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{row.employee.employeeNo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="sticky left-[200px] bg-background z-10 text-sm text-muted-foreground">
                          {row.employee.department || '—'}
                        </TableCell>
                        {projects.map(project => {
                          const pct = row.allocations[project.id]
                          return (
                            <TableCell key={project.id} className="text-center">
                              {pct != null ? (
                                <Badge
                                  variant={pct >= 50 ? 'default' : 'secondary'}
                                  className="font-mono text-xs"
                                >
                                  {pct}%
                                </Badge>
                              ) : (
                                <span className="inline-block w-10 h-6 bg-muted rounded" />
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center">
                          <Badge
                            variant={isOverAllocated ? 'destructive' : row.totalPct === 100 ? 'default' : 'outline'}
                            className="font-mono text-xs"
                          >
                            {row.totalPct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projectAllocations.addAllocation')}</DialogTitle>
            <DialogDescription>{t('projectAllocations.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allocEmployee">{t('fields.fullName')}</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger id="allocEmployee">
                  <SelectValue placeholder={t('fields.fullName')} />
                </SelectTrigger>
                <SelectContent>
                  {allEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocProject">{t('projectAllocations.project')}</Label>
              <Select value={formProjectId} onValueChange={setFormProjectId}>
                <SelectTrigger id="allocProject">
                  <SelectValue placeholder={t('projectAllocations.project')} />
                </SelectTrigger>
                <SelectContent>
                  {allProjects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name} ({proj.projectNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocPercentage">{t('projectAllocations.percentage')}</Label>
              <Input
                id="allocPercentage"
                type="number"
                min={1}
                max={100}
                value={formPercentage}
                onChange={e => setFormPercentage(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allocStartDate">{t('projectAllocations.startDate')}</Label>
                <Input
                  id="allocStartDate"
                  type="date"
                  value={formStartDate}
                  onChange={e => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocEndDate">{t('projectAllocations.endDate')}</Label>
                <Input
                  id="allocEndDate"
                  type="date"
                  value={formEndDate}
                  onChange={e => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formEmployeeId || !formProjectId || !formPercentage || !formStartDate}
            >
              {saving ? tc('labels.loading') : tc('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
