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

interface PFEnrollment {
  id: string
  employee?: { fullName: string; department?: { name: string } }
  employeeName?: string
  departmentName?: string
  enrollmentDate: string
  employeeContribRate: number
  employerContribRate: number
  currentBalance: number
  status: string
}

export default function PFEnrollmentsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [enrollments, setEnrollments] = useState<PFEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFEnrollment>[] = [
    { id: 'employeeName', header: 'Employee', accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { id: 'department', header: 'Department', accessorFn: (row) => row.employee?.department?.name || row.departmentName || '\u2014' },
    { accessorKey: 'enrollmentDate', header: 'Enrollment Date', cell: ({ row }) => formatDate(row.getValue('enrollmentDate')) },
    { accessorKey: 'employeeContribRate', header: 'Employee Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employeeContribRate')}%</span> },
    { accessorKey: 'employerContribRate', header: 'Employer Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employerContribRate')}%</span> },
    { accessorKey: 'currentBalance', header: 'Balance', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('currentBalance'))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/enrollments?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setEnrollments(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="PF Members" description="Provident fund enrolled members">
        <Button size="sm" onClick={() => router.push('/hr/pension/provident-fund/enrollments/new')}>
          <Plus className="h-4 w-4 mr-2" />Enroll Employee
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={enrollments}
        searchKey="employeeName"
        searchPlaceholder="Search members..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/provident-fund/enrollments/${row.id}`)}
      />
    </div>
  )
}
