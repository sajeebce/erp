'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, X, Filter } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { useFormatters } from '@/hooks/use-formatters'

interface Employee {
  id: string
  employeeNo: string
  fullName: string
  photo?: string | null
  dutyStation?: string | null
  religion?: string | null
  department?: { id: string; name: string }
  departmentName?: string
  departmentId?: string
  designation?: { title: string }
  designationId?: string
  designationTitle?: string
  basicSalary: string | number
  employmentType: string
  status: string
}

interface Department { id: string; name: string }
interface Designation { id: string; title: string }

const RELIGION_OPTIONS = [
  'Islam',
  'Hinduism',
  'Christianity',
  'Buddhism',
  'Other',
  'Prefer not to say',
  'Not specified',
] as const

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function normalizeReligion(value: string | null | undefined) {
  const raw = String(value || '').trim()
  if (!raw) return 'Not specified'

  const normalized = raw.toUpperCase()
  const matched = RELIGION_OPTIONS.find((option) => option.toUpperCase() === normalized)
  return matched || raw
}

export default function HRPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterDept, setFilterDept] = useState('')
  const [filterDesignation, setFilterDesignation] = useState('')
  const [filterStation, setFilterStation] = useState('')
  const [filterReligion, setFilterReligion] = useState('')

  const hasFilters = filterDept || filterDesignation || filterStation || filterReligion

  // Derive unique duty stations from data
  const dutyStations = useMemo(() => {
    const set = new Set<string>()
    employees.forEach(e => { if (e.dutyStation) set.add(e.dutyStation) })
    return Array.from(set).sort()
  }, [employees])

  const religionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    RELIGION_OPTIONS.forEach((religion) => counts.set(religion, 0))
    employees
      .filter((employee) => employee.status === 'ACTIVE')
      .forEach((employee) => {
        const key = normalizeReligion(employee.religion)
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    return Array.from(counts.entries()).sort(
      ([a], [b]) => RELIGION_OPTIONS.indexOf(a as typeof RELIGION_OPTIONS[number]) - RELIGION_OPTIONS.indexOf(b as typeof RELIGION_OPTIONS[number])
    )
  }, [employees])

  // Apply client-side filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (filterDept && (e.department?.id || e.departmentId) !== filterDept) return false
      if (filterDesignation && e.designationId !== filterDesignation) return false
      if (filterStation && e.dutyStation !== filterStation) return false
      if (filterReligion && normalizeReligion(e.religion) !== filterReligion) return false
      return true
    })
  }, [employees, filterDept, filterDesignation, filterStation, filterReligion])

  const columns: ColumnDef<Employee>[] = [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }) => {
        const emp = row.original
        return (
          <div className="h-8 w-8 rounded-full shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
            {emp.photo ? (
              <img src={emp.photo} alt={emp.fullName} className="h-8 w-8 object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{getInitials(emp.fullName)}</span>
            )}
          </div>
        )
      },
      size: 48,
      enableSorting: false,
    },
    { accessorKey: 'employeeNo', header: t('fields.employeeNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('employeeNo')}</span> },
    { accessorKey: 'fullName', header: t('fields.fullName'), cell: ({ row }) => <span className="font-medium">{row.getValue('fullName')}</span> },
    { id: 'departmentName', header: t('fields.department'), cell: ({ row }) => {
      const emp = row.original
      return emp.department?.name || emp.departmentName || '\u2014'
    }},
    { id: 'designationTitle', header: t('fields.designation'), cell: ({ row }) => {
      const emp = row.original
      return emp.designation?.title || emp.designationTitle || '\u2014'
    }},
    { id: 'dutyStation', header: t('form.dutyStation'), cell: ({ row }) => row.original.dutyStation || '\u2014' },
    { accessorKey: 'basicSalary', header: t('fields.basicSalary'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('basicSalary')))}</span> },
    { accessorKey: 'employmentType', header: t('fields.type'), cell: ({ row }) => <StatusBadge status={row.getValue('employmentType')} /> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/hr/employees?limit=500').then(r => r.json()),
      fetch('/api/v1/hr/departments').then(r => r.json()),
      fetch('/api/v1/hr/designations').then(r => r.json()),
    ]).then(([empJson, deptJson, desigJson]) => {
      if (empJson.success) setEmployees(empJson.data)
      if (deptJson.success) setDepartments(deptJson.data)
      if (desigJson.success) setDesignations(desigJson.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('employeeDirectory')} description={t('employeeDirectoryDesc')}>
        <Button size="sm" onClick={() => router.push('/hr/employees/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('addEmployee')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Religion-wise Employee Count</CardTitle>
        </CardHeader>
        <CardContent>
          {religionCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active employee religion data found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {religionCounts.map(([religion, count]) => (
                <Badge key={religion} variant="outline" className="px-3 py-1">
                  {religion}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <SearchableSelect
          options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
          value={filterDept}
          onValueChange={setFilterDept}
          placeholder={t('fields.department')}
        />
        <SearchableSelect
          options={[{ value: '', label: 'All Designations' }, ...designations.map(d => ({ value: d.id, label: d.title }))]}
          value={filterDesignation}
          onValueChange={setFilterDesignation}
          placeholder={t('fields.designation')}
        />
        <SearchableSelect
          options={[{ value: '', label: 'All Duty Stations' }, ...dutyStations.map(s => ({ value: s, label: s }))]}
          value={filterStation}
          onValueChange={setFilterStation}
          placeholder={t('form.dutyStation')}
        />
        <SearchableSelect
          options={[{ value: '', label: 'All Religions' }, ...RELIGION_OPTIONS.map(r => ({ value: r, label: r }))]}
          value={filterReligion}
          onValueChange={setFilterReligion}
          placeholder="Religion"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDept(''); setFilterDesignation(''); setFilterStation(''); setFilterReligion('') }}>
            <X className="h-3.5 w-3.5 mr-1" />{tc('buttons.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredEmployees}
        searchKey="fullName"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/employees/${row.id}`)}
      />
    </div>
  )
}
