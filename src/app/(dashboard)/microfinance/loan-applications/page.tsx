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

interface LoanApplication {
  id: string
  applicationNo: string
  member?: { fullName: string }
  memberName?: string
  product?: { name: string }
  productName?: string
  amountRequested: string | number
  status: string
}

export default function LoanApplicationsPage() {
  const t = useTranslations('microfinance')
  const { formatCurrency } = useFormatters()
  const tc = useTranslations('common')

  const columns: ColumnDef<LoanApplication>[] = [
    { accessorKey: 'applicationNo', header: t('loanApplications.applicationNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('applicationNo')}</span> },
    { id: 'memberName', header: t('loanApplications.member'), cell: ({ row }) => {
      const app = row.original
      return <span className="font-medium">{app.member?.fullName || app.memberName || '\u2014'}</span>
    }},
    { id: 'productName', header: t('loanApplications.product'), cell: ({ row }) => {
      const app = row.original
      return app.product?.name || app.productName || '\u2014'
    }},
    { accessorKey: 'amountRequested', header: t('loanApplications.amountRequested'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('amountRequested')))}</span> },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]
  const router = useRouter()
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/microfinance/loan-applications?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setApplications(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('loanApplications.title')} description={t('loanApplications.description')}>
        <Button size="sm" onClick={() => router.push('/microfinance/loan-applications/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('loanApplications.newApplication')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={applications}
        searchKey="applicationNo"
        searchPlaceholder={t('loanApplications.searchPlaceholder')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/microfinance/loan-applications/${row.id}`)}
      />
    </div>
  )
}
