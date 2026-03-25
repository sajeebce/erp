'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

interface Beneficiary {
  id: string
  beneficiaryNo: string
  name: string
  gender: string
  district: string
  upazila: string
  status: string
  enrollmentCount: number
}

const columns: ColumnDef<Beneficiary>[] = [
  { accessorKey: 'beneficiaryNo', header: 'Beneficiary No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('beneficiaryNo')}</span> },
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'gender', header: 'Gender' },
  { accessorKey: 'district', header: 'District' },
  { accessorKey: 'upazila', header: 'Upazila' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  { accessorKey: 'enrollmentCount', header: 'Enrollments', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('enrollmentCount') ?? 0}</span> },
]

export default function BeneficiariesPage() {
  const router = useRouter()
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/beneficiaries?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setBeneficiaries(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Beneficiary Registry" description="Manage beneficiary registry and program enrollment">
        <Button size="sm" onClick={() => router.push('/beneficiaries/new')}>
          <Plus className="h-4 w-4 mr-2" />Register Beneficiary
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={beneficiaries}
        searchKey="name"
        searchPlaceholder="Search beneficiaries..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/beneficiaries/${row.id}`)}
      />
    </div>
  )
}
