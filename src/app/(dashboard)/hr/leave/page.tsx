'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

interface LeaveApplication {
  id: string
  applicationNo: string
  employee?: { fullName: string }
  employeeName?: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: string
}

const columns: ColumnDef<LeaveApplication>[] = [
  { accessorKey: 'applicationNo', header: 'Application No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('applicationNo')}</span> },
  { id: 'employeeName', header: 'Employee', accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'leaveType', header: 'Leave Type', cell: ({ row }) => <StatusBadge status={row.getValue('leaveType')} /> },
  { accessorKey: 'startDate', header: 'Start Date', cell: ({ row }) => new Date(row.getValue('startDate') as string).toLocaleDateString() },
  { accessorKey: 'endDate', header: 'End Date', cell: ({ row }) => new Date(row.getValue('endDate') as string).toLocaleDateString() },
  { accessorKey: 'days', header: 'Days', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('days')}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function LeavePage() {
  const router = useRouter()
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/leave?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setApplications(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Manage leave applications, balances, and approvals">
        <Button size="sm" onClick={() => router.push('/hr/leave/new')}>
          <Plus className="h-4 w-4 mr-2" />Apply Leave
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={applications}
        searchKey="employeeName"
        searchPlaceholder="Search by employee..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/leave/${row.id}`)}
      />
    </div>
  )
}
