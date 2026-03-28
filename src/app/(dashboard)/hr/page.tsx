'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Employee {
  id: string
  employeeNo: string
  fullName: string
  department?: { name: string }
  departmentName?: string
  designation?: { title: string }
  designationTitle?: string
  basicSalary: string | number
  employmentType: string
  status: string
}

export default function HRPage() {
  const t = useTranslations('hr')
  const { formatCurrency } = useFormatters()
  const tc = useTranslations('common')
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Employee>[] = [
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
    { accessorKey: 'basicSalary', header: t('fields.basicSalary'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('basicSalary')))}</span> },
    { accessorKey: 'employmentType', header: t('fields.type'), cell: ({ row }) => <StatusBadge status={row.getValue('employmentType')} /> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('employeeDirectory')} description={t('employeeDirectoryDesc')}>
        <Button size="sm" onClick={() => router.push('/hr/employees/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('addEmployee')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={employees}
        searchKey="fullName"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/employees/${row.id}`)}
      />
    </div>
  )
}
