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

interface GratuityPolicy {
  id: string
  name: string
  formulaType: string
  ratePerYear: number
  vestingPeriodMonths: number
  accrualFrequency: string
  isDefault: boolean
  isActive: boolean
}

export default function GratuityPoliciesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()

  const [policies, setPolicies] = useState<GratuityPolicy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/policies')
      .then(res => res.json())
      .then(json => { if (json.success) setPolicies(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const columns: ColumnDef<GratuityPolicy>[] = [
    { accessorKey: 'name', header: 'Policy Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'formulaType', header: 'Formula Type', cell: ({ row }) => <StatusBadge status={row.getValue('formulaType')} /> },
    { accessorKey: 'ratePerYear', header: 'Rate / Year', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('ratePerYear')}</span> },
    { accessorKey: 'vestingPeriodMonths', header: 'Vesting (Months)', cell: ({ row }) => row.getValue('vestingPeriodMonths') },
    { accessorKey: 'accrualFrequency', header: 'Accrual Frequency', cell: ({ row }) => <StatusBadge status={row.getValue('accrualFrequency')} /> },
    { accessorKey: 'isDefault', header: 'Default', cell: ({ row }) => row.getValue('isDefault') ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-muted-foreground">No</span> },
    { accessorKey: 'isActive', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('isActive') ? 'ACTIVE' : 'INACTIVE'} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Gratuity Policies" description="Configure gratuity calculation rules, vesting periods, and accrual frequencies">
        <Button size="sm" onClick={() => router.push('/hr/pension/gratuity/policies/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={policies}
        searchKey="name"
        searchPlaceholder="Search policies..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/pension/gratuity/policies/${row.id}`)}
      />
    </div>
  )
}
