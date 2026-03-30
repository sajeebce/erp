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

interface PFPolicy {
  id: string
  name: string
  employeeContribRate: number
  employerContribRate: number
  interestRate: number
  vestingSchedule: string
  isDefault: boolean
  isActive: boolean
}

export default function PFPoliciesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const [policies, setPolicies] = useState<PFPolicy[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFPolicy>[] = [
    { accessorKey: 'name', header: 'Policy Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'employeeContribRate', header: 'Employee Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employeeContribRate')}%</span> },
    { accessorKey: 'employerContribRate', header: 'Employer Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('employerContribRate')}%</span> },
    { accessorKey: 'interestRate', header: 'Interest Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('interestRate')}%</span> },
    { accessorKey: 'vestingSchedule', header: 'Vesting Schedule', cell: ({ row }) => <span className="text-sm">{row.getValue('vestingSchedule') || '\u2014'}</span> },
    { accessorKey: 'isDefault', header: 'Default', cell: ({ row }) => row.getValue('isDefault') ? <StatusBadge status="DEFAULT" /> : <span className="text-muted-foreground">\u2014</span> },
    { accessorKey: 'isActive', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('isActive') ? 'ACTIVE' : 'INACTIVE'} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/policies?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setPolicies(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="PF Policies" description="Manage provident fund contribution policies">
        <Button size="sm" onClick={() => router.push('/hr/pension/provident-fund/policies/new')}>
          <Plus className="h-4 w-4 mr-2" />New Policy
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={policies}
        searchKey="name"
        searchPlaceholder="Search policies..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/provident-fund/policies/${row.id}`)}
      />
    </div>
  )
}
