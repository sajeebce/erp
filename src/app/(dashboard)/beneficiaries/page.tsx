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

export default function BeneficiariesPage() {
  const router = useRouter()
  const t = useTranslations('beneficiaries')
  const tc = useTranslations('common')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Beneficiary>[] = [
    { accessorKey: 'beneficiaryNo', header: t('fields.beneficiaryNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('beneficiaryNo')}</span> },
    { accessorKey: 'name', header: t('fields.name'), cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'gender', header: t('fields.gender') },
    { accessorKey: 'district', header: t('fields.district') },
    { accessorKey: 'upazila', header: t('fields.upazila') },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
    { accessorKey: 'enrollmentCount', header: t('fields.enrollments'), cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('enrollmentCount') ?? 0}</span> },
  ]

  useEffect(() => {
    fetch('/api/v1/beneficiaries?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setBeneficiaries(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('registry.title')} description={t('registry.description')}>
        <Button size="sm" onClick={() => router.push('/beneficiaries/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('registerBeneficiary')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={beneficiaries}
        searchKey="name"
        searchPlaceholder={t('registry.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/beneficiaries/${row.id}`)}
      />
    </div>
  )
}
