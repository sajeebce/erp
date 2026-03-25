'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT } from '@/lib/formatters'

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

const columns: ColumnDef<Employee>[] = [
  { accessorKey: 'employeeNo', header: 'Employee No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('employeeNo')}</span> },
  { accessorKey: 'fullName', header: 'Full Name', cell: ({ row }) => <span className="font-medium">{row.getValue('fullName')}</span> },
  { id: 'departmentName', header: 'Department', cell: ({ row }) => {
    const emp = row.original
    return emp.department?.name || emp.departmentName || '\u2014'
  }},
  { id: 'designationTitle', header: 'Designation', cell: ({ row }) => {
    const emp = row.original
    return emp.designation?.title || emp.designationTitle || '\u2014'
  }},
  { accessorKey: 'basicSalary', header: 'Basic Salary', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('basicSalary')))}</span> },
  { accessorKey: 'employmentType', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('employmentType')} /> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function HRPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Directory" description="Manage employee directory and HR operations">
        <Button size="sm" onClick={() => router.push('/hr/employees/new')}>
          <Plus className="h-4 w-4 mr-2" />Add Employee
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={employees}
        searchKey="fullName"
        searchPlaceholder="Search employees..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/employees/${row.id}`)}
      />
    </div>
  )
}
