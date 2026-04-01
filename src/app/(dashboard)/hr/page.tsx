'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, X, Filter } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  department?: { id: string; name: string }
  departmentName?: string
  departmentId?: string
  designation?: { title: string }
  designationTitle?: string
  basicSalary: string | number
  employmentType: string
  status: string
}

interface Department { id: string; name: string }

const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'] as const
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function HRPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStation, setFilterStation] = useState('')

  const hasFilters = filterDept || filterStatus || filterType || filterStation

  // Derive unique duty stations from data
  const dutyStations = useMemo(() => {
    const set = new Set<string>()
    employees.forEach(e => { if (e.dutyStation) set.add(e.dutyStation) })
    return Array.from(set).sort()
  }, [employees])

  // Apply client-side filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (filterDept && (e.department?.id || e.departmentId) !== filterDept) return false
      if (filterStatus && e.status !== filterStatus) return false
      if (filterType && e.employmentType !== filterType) return false
      if (filterStation && e.dutyStation !== filterStation) return false
      return true
    })
  }, [employees, filterDept, filterStatus, filterType, filterStation])

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
    ]).then(([empJson, deptJson]) => {
      if (empJson.success) setEmployees(empJson.data)
      if (deptJson.success) setDepartments(deptJson.data)
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <SearchableSelect
          options={[{ value: '', label: tc('buttons.all') }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
          value={filterDept}
          onValueChange={setFilterDept}
          placeholder={t('fields.department')}
        />
        <SearchableSelect
          options={[{ value: '', label: tc('buttons.all') }, ...STATUSES.map(s => ({ value: s, label: tc(`status.${s}`) }))]}
          value={filterStatus}
          onValueChange={setFilterStatus}
          placeholder={tc('labels.status')}
        />
        <SearchableSelect
          options={[{ value: '', label: tc('buttons.all') }, ...EMPLOYMENT_TYPES.map(et => ({ value: et, label: tc(`employmentTypes.${et}`) }))]}
          value={filterType}
          onValueChange={setFilterType}
          placeholder={t('fields.type')}
        />
        {dutyStations.length > 0 && (
          <SearchableSelect
            options={[{ value: '', label: tc('buttons.all') }, ...dutyStations.map(s => ({ value: s, label: s }))]}
            value={filterStation}
            onValueChange={setFilterStation}
            placeholder={t('form.dutyStation')}
          />
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDept(''); setFilterStatus(''); setFilterType(''); setFilterStation('') }}>
            <X className="h-3.5 w-3.5 mr-1" />{tc('buttons.clear')}
          </Button>
        )}
        {hasFilters && (
          <Badge variant="secondary" className="text-xs">
            {filteredEmployees.length} / {employees.length}
          </Badge>
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
